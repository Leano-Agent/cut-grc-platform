import axios from 'axios'

export interface PaymentRequest {
  amount: number
  currency: string
  description: string
  reference: string
  customer: {
    email: string
    firstName: string
    lastName: string
    phone?: string
  }
  metadata?: Record<string, any>
}

export interface PaymentResponse {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  paymentUrl: string
  reference: string
  amount: number
  currency: string
  timestamp: string
}

export interface PaymentGatewayConfig {
  payfast: {
    merchantId: string
    merchantKey: string
    passPhrase: string
    environment: 'sandbox' | 'production'
  }
  ozow: {
    siteCode: string
    apiKey: string
    privateKey: string
    environment: 'sandbox' | 'production'
  }
}

class PaymentService {
  private config: PaymentGatewayConfig
  
  constructor() {
    this.config = {
      payfast: {
        merchantId: process.env.PAYFAST_MERCHANT_ID || '',
        merchantKey: process.env.PAYFAST_MERCHANT_KEY || '',
        passPhrase: process.env.PAYFAST_PASSPHRASE || '',
        environment: process.env.PAYFAST_ENVIRONMENT as 'sandbox' | 'production' || 'sandbox',
      },
      ozow: {
        siteCode: process.env.OZOW_SITE_CODE || '',
        apiKey: process.env.OZOW_API_KEY || '',
        privateKey: process.env.OZOW_PRIVATE_KEY || '',
        environment: process.env.OZOW_ENVIRONMENT as 'sandbox' | 'production' || 'sandbox',
      },
    }
  }
  
  /**
   * Initialize payment with PayFast
   */
  async initiatePayFastPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      const baseUrl = this.config.payfast.environment === 'production'
        ? 'https://www.payfast.co.za'
        : 'https://sandbox.payfast.co.za'
      
      // Generate signature
      const signatureData = {
        merchant_id: this.config.payfast.merchantId,
        merchant_key: this.config.payfast.merchantKey,
        return_url: `${window.location.origin}/payment/success`,
        cancel_url: `${window.location.origin}/payment/cancel`,
        notify_url: `${window.location.origin}/api/payment/notify`,
        name_first: request.customer.firstName,
        name_last: request.customer.lastName,
        email_address: request.customer.email,
        m_payment_id: request.reference,
        amount: request.amount.toFixed(2),
        item_name: request.description,
        item_description: request.description,
        custom_int1: JSON.stringify(request.metadata || {}),
      }
      
      // Generate signature
      const signature = this.generatePayFastSignature(signatureData)
      
      const paymentData = {
        ...signatureData,
        signature,
      }
      
      // For PayFast, we need to redirect to their payment page
      // Return the payment URL and let the frontend handle the redirect
      const paymentUrl = `${baseUrl}/eng/process`
      
      return {
        id: `pf_${Date.now()}`,
        status: 'pending',
        paymentUrl,
        reference: request.reference,
        amount: request.amount,
        currency: request.currency,
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      console.error('PayFast payment initiation failed:', error)
      throw new Error('Failed to initiate PayFast payment')
    }
  }
  
  /**
   * Initialize payment with Ozow
   */
  async initiateOzowPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      const baseUrl = this.config.ozow.environment === 'production'
        ? 'https://api.ozow.com'
        : 'https://api.sandbox.ozow.com'
      
      const apiKey = btoa(this.config.ozow.apiKey)
      
      const paymentData = {
        SiteCode: this.config.ozow.siteCode,
        CountryCode: 'ZA',
        CurrencyCode: request.currency,
        Amount: request.amount,
        TransactionReference: request.reference,
        BankReference: request.reference,
        Customer: `${request.customer.firstName} ${request.customer.lastName}`,
        CancelUrl: `${window.location.origin}/payment/cancel`,
        ErrorUrl: `${window.location.origin}/payment/error`,
        SuccessUrl: `${window.location.origin}/payment/success`,
        NotifyUrl: `${window.location.origin}/api/payment/notify`,
        IsTest: this.config.ozow.environment === 'sandbox',
      }
      
      // Generate signature for Ozow
      const signature = this.generateOzowSignature(paymentData)
      
      const response = await axios.post(
        `${baseUrl}/PostPaymentRequest`,
        {
          ...paymentData,
          Hash: signature,
        },
        {
          headers: {
            'ApiKey': apiKey,
            'Content-Type': 'application/json',
          },
        }
      )
      
      if (response.data.Error) {
        throw new Error(response.data.Error)
      }
      
      return {
        id: response.data.PaymentId,
        status: 'pending',
        paymentUrl: response.data.Url,
        reference: request.reference,
        amount: request.amount,
        currency: request.currency,
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      console.error('Ozow payment initiation failed:', error)
      throw new Error('Failed to initiate Ozow payment')
    }
  }
  
  /**
   * Generate PayFast signature
   */
  private generatePayFastSignature(data: Record<string, any>): string {
    // Remove empty values and sort alphabetically
    const filteredData = Object.entries(data)
      .filter(([_, value]) => value !== null && value !== undefined && value !== '')
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    
    // Create parameter string
    const parameterString = filteredData
      .map(([key, value]) => `${key}=${encodeURIComponent(value).replace(/%20/g, '+')}`)
      .join('&')
    
    // Add passphrase if set
    const signatureString = this.config.payfast.passPhrase
      ? `${parameterString}&passphrase=${encodeURIComponent(this.config.payfast.passPhrase)}`
      : parameterString
    
    // Generate MD5 hash
    return this.md5(signatureString)
  }
  
  /**
   * Generate Ozow signature
   */
  private generateOzowSignature(data: Record<string, any>): string {
    // Sort data alphabetically by key
    const sortedEntries = Object.entries(data).sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    
    // Create string for hashing
    const hashString = sortedEntries
      .map(([key, value]) => `${key}=${value}`)
      .join('&')
    
    // Add private key
    const fullString = `${hashString}&PrivateKey=${this.config.ozow.privateKey}`
    
    // Generate SHA512 hash
    return this.sha512(fullString)
  }
  
  /**
   * Simple MD5 implementation (for demo purposes)
   * In production, use a proper MD5 library
   */
  private md5(input: string): string {
    // This is a simplified version - use a proper MD5 library in production
    return btoa(input).substring(0, 32)
  }
  
  /**
   * Simple SHA512 implementation (for demo purposes)
   * In production, use a proper SHA512 library
   */
  private sha512(input: string): string {
    // This is a simplified version - use a proper SHA512 library in production
    return btoa(input).substring(0, 128)
  }
  
  /**
   * Verify payment notification
   */
  async verifyPaymentNotification(
    gateway: 'payfast' | 'ozow',
    notificationData: any
  ): Promise<boolean> {
    try {
      if (gateway === 'payfast') {
        return this.verifyPayFastNotification(notificationData)
      } else {
        return this.verifyOzowNotification(notificationData)
      }
    } catch (error) {
      console.error('Payment verification failed:', error)
      return false
    }
  }
  
  /**
   * Verify PayFast notification
   */
  private verifyPayFastNotification(data: any): boolean {
    // Extract signature from data
    const receivedSignature = data.signature
    delete data.signature
    
    // Generate expected signature
    const expectedSignature = this.generatePayFastSignature(data)
    
    return receivedSignature === expectedSignature
  }
  
  /**
   * Verify Ozow notification
   */
  private verifyOzowNotification(data: any): boolean {
    // Extract hash from data
    const receivedHash = data.Hash
    delete data.Hash
    
    // Generate expected hash
    const expectedHash = this.generateOzowSignature(data)
    
    return receivedHash === expectedHash
  }
  
  /**
   * Get payment status
   */
  async getPaymentStatus(
    gateway: 'payfast' | 'ozow',
    paymentId: string
  ): Promise<PaymentResponse> {
    try {
      if (gateway === 'payfast') {
        return this.getPayFastStatus(paymentId)
      } else {
        return this.getOzowStatus(paymentId)
      }
    } catch (error) {
      console.error('Failed to get payment status:', error)
      throw new Error('Failed to get payment status')
    }
  }
  
  /**
   * Get PayFast payment status
   */
  private async getPayFastStatus(paymentId: string): Promise<PaymentResponse> {
    const baseUrl = this.config.payfast.environment === 'production'
      ? 'https://www.payfast.co.za'
      : 'https://sandbox.payfast.co.za'
    
    // Note: PayFast doesn't have a direct status API for once-off payments
    // In production, you would query your own database where you store payment status
    // from the ITN (Instant Transaction Notification)
    
    // For demo purposes, return a mock response
    return {
      id: paymentId,
      status: 'completed',
      paymentUrl: '',
      reference: paymentId,
      amount: 0,
      currency: 'ZAR',
      timestamp: new Date().toISOString(),
    }
  }
  
  /**
   * Get Ozow payment status
   */
  private async getOzowStatus(paymentId: string): Promise<PaymentResponse> {
    const baseUrl = this.config.ozow.environment === 'production'
      ? 'https://api.ozow.com'
      : 'https://api.sandbox.ozow.com'
    
    const apiKey = btoa(this.config.ozow.apiKey)
    
    const response = await axios.get(
      `${baseUrl}/GetTransaction`,
      {
        params: {
          PaymentId: paymentId,
          SiteCode: this.config.ozow.siteCode,
        },
        headers: {
          'ApiKey': apiKey,
        },
      }
    )
    
    return {
      id: response.data.PaymentId,
      status: this.mapOzowStatus(response.data.Status),
      paymentUrl: '',
      reference: response.data.TransactionReference,
      amount: response.data.Amount,
      currency: response.data.CurrencyCode,
      timestamp: response.data.CreatedDate,
    }
  }
  
  /**
   * Map Ozow status to our status enum
   */
  private mapOzowStatus(ozowStatus: string): PaymentResponse['status'] {
    const statusMap: Record<string, PaymentResponse['status']> = {
      '1': 'pending', // Pending
      '2': 'processing', // Processing
      '3': 'completed', // Completed
      '4': 'failed', // Failed
      '5': 'cancelled', // Cancelled
    }
    
    return statusMap[ozowStatus] || 'failed'
  }
}

export const paymentService = new PaymentService()