import axios from 'axios'

export interface SMSMessage {
  to: string
  message: string
  from?: string
}

export interface WhatsAppMessage {
  to: string
  message: string
  template?: string
  parameters?: Record<string, any>
}

export interface USSDMenu {
  sessionId: string
  phoneNumber: string
  serviceCode: string
  text: string
}

export interface USSDResponse {
  message: string
  shouldClose: boolean
}

export interface CommunicationConfig {
  twilio: {
    accountSid: string
    authToken: string
    phoneNumber: string
    whatsappNumber: string
  }
  africasTalking: {
    username: string
    apiKey: string
    shortCode: string
    senderId: string
  }
}

class CommunicationService {
  private config: CommunicationConfig
  
  constructor() {
    this.config = {
      twilio: {
        accountSid: process.env.TWILIO_ACCOUNT_SID || '',
        authToken: process.env.TWILIO_AUTH_TOKEN || '',
        phoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
        whatsappNumber: process.env.TWILIO_WHATSAPP_NUMBER || '',
      },
      africasTalking: {
        username: process.env.AT_USERNAME || '',
        apiKey: process.env.AT_API_KEY || '',
        shortCode: process.env.AT_SHORT_CODE || '',
        senderId: process.env.AT_SENDER_ID || '',
      },
    }
  }
  
  /**
   * Send SMS via Twilio
   */
  async sendSMS(message: SMSMessage): Promise<boolean> {
    try {
      const auth = btoa(`${this.config.twilio.accountSid}:${this.config.twilio.authToken}`)
      
      const formData = new URLSearchParams()
      formData.append('To', message.to)
      formData.append('From', message.from || this.config.twilio.phoneNumber)
      formData.append('Body', message.message)
      
      const response = await axios.post(
        `https://api.twilio.com/2010-04-01/Accounts/${this.config.twilio.accountSid}/Messages.json`,
        formData,
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      )
      
      return response.status === 201
    } catch (error) {
      console.error('Failed to send SMS:', error)
      return false
    }
  }
  
  /**
   * Send WhatsApp message via Twilio
   */
  async sendWhatsApp(message: WhatsAppMessage): Promise<boolean> {
    try {
      const auth = btoa(`${this.config.twilio.accountSid}:${this.config.twilio.authToken}`)
      
      const formData = new URLSearchParams()
      formData.append('To', `whatsapp:${message.to}`)
      formData.append('From', `whatsapp:${this.config.twilio.whatsappNumber}`)
      
      if (message.template) {
        // Send template message
        formData.append('ContentSid', message.template)
        
        if (message.parameters) {
          formData.append('ContentVariables', JSON.stringify(message.parameters))
        }
      } else {
        // Send regular message
        formData.append('Body', message.message)
      }
      
      const response = await axios.post(
        `https://api.twilio.com/2010-04-01/Accounts/${this.config.twilio.accountSid}/Messages.json`,
        formData,
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      )
      
      return response.status === 201
    } catch (error) {
      console.error('Failed to send WhatsApp message:', error)
      return false
    }
  }
  
  /**
   * Send bulk SMS via Africa's Talking
   */
  async sendBulkSMS(messages: SMSMessage[]): Promise<boolean> {
    try {
      const recipients = messages.map(msg => msg.to).join(',')
      const message = messages[0].message // All messages should have same content for bulk
      
      const response = await axios.post(
        'https://api.africastalking.com/version1/messaging',
        {
          username: this.config.africasTalking.username,
          to: recipients,
          message: message,
          from: this.config.africasTalking.senderId,
        },
        {
          headers: {
            'ApiKey': this.config.africasTalking.apiKey,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      )
      
      return response.data.SMSMessageData.Recipients.length > 0
    } catch (error) {
      console.error('Failed to send bulk SMS:', error)
      return false
    }
  }
  
  /**
   * Process USSD request
   */
  async processUSSD(menu: USSDMenu): Promise<USSDResponse> {
    try {
      const text = menu.text || ''
      const steps = text.split('*')
      const lastStep = steps[steps.length - 1]
      
      // Main menu
      if (text === '') {
        return {
          message: `CON Welcome to CUT GRC Services
1. Service Requests
2. Document Access
3. Payment Status
4. Contact Information
5. Help`,
          shouldClose: false,
        }
      }
      
      // Service Requests
      if (steps[0] === '1') {
        return this.handleServiceRequests(steps)
      }
      
      // Document Access
      if (steps[0] === '2') {
        return this.handleDocumentAccess(steps)
      }
      
      // Payment Status
      if (steps[0] === '3') {
        return this.handlePaymentStatus(steps, menu.phoneNumber)
      }
      
      // Contact Information
      if (steps[0] === '4') {
        return {
          message: `CON Contact Information:
CUT GRC Support
Phone: +27 51 507 3911
Email: grc@cut.ac.za
Website: www.cut.ac.za

0. Back to Main Menu`,
          shouldClose: false,
        }
      }
      
      // Help
      if (steps[0] === '5') {
        return {
          message: `CON Help & Support:
For assistance with:
- Service Requests: Dial 1
- Documents: Dial 2
- Payments: Dial 3
- Contact: Dial 4

0. Back to Main Menu`,
          shouldClose: false,
        }
      }
      
      // Back to main menu
      if (lastStep === '0') {
        return {
          message: `CON Welcome to CUT GRC Services
1. Service Requests
2. Document Access
3. Payment Status
4. Contact Information
5. Help`,
          shouldClose: false,
        }
      }
      
      // Invalid option
      return {
        message: 'END Invalid option selected. Please try again.',
        shouldClose: true,
      }
    } catch (error) {
      console.error('Failed to process USSD:', error)
      return {
        message: 'END An error occurred. Please try again later.',
        shouldClose: true,
      }
    }
  }
  
  /**
   * Handle service requests USSD flow
   */
  private handleServiceRequests(steps: string[]): USSDResponse {
    if (steps.length === 1) {
      return {
        message: `CON Service Requests:
1. Report Issue
2. Check Status
3. View Requests

0. Back to Main Menu`,
        shouldClose: false,
      }
    }
    
    if (steps[1] === '1') {
      if (steps.length === 2) {
        return {
          message: `CON Select Issue Type:
1. Water & Sanitation
2. Electricity
3. Roads & Streets
4. Waste Management
5. Other

0. Back`,
          shouldClose: false,
        }
      }
      
      if (steps.length === 3) {
        return {
          message: 'CON Please describe the issue (max 160 chars):',
          shouldClose: false,
        }
      }
      
      if (steps.length === 4) {
        const issueType = this.getIssueType(steps[2])
        const description = steps[3]
        
        // In production, save to database and generate tracking ID
        const trackingId = `SR${Date.now().toString().slice(-6)}`
        
        return {
          message: `END Thank you. Your service request has been submitted.
Tracking ID: ${trackingId}
Issue: ${issueType}
We will contact you shortly.`,
          shouldClose: true,
        }
      }
    }
    
    if (steps[1] === '2') {
      return {
        message: 'CON Enter your Tracking ID:',
        shouldClose: false,
      }
    }
    
    if (steps[1] === '3') {
      // In production, fetch from database
      return {
        message: `END Your recent requests:
1. SR123456 - Water leak - In Progress
2. SR123457 - Pothole - Completed

For details, visit our website or call support.`,
        shouldClose: true,
      }
    }
    
    return {
      message: 'END Invalid option selected.',
      shouldClose: true,
    }
  }
  
  /**
   * Handle document access USSD flow
   */
  private handleDocumentAccess(steps: string[]): USSDResponse {
    if (steps.length === 1) {
      return {
        message: `CON Document Access:
1. Policies
2. Reports
3. Forms
4. Regulations

0. Back to Main Menu`,
        shouldClose: false,
      }
    }
    
    if (steps[1] === '1') {
      return {
        message: `END Available Policies:
1. Privacy Policy
2. Terms of Service
3. Procurement Policy

To download, visit our website or request via SMS.`,
        shouldClose: true,
      }
    }
    
    if (steps[1] === '2') {
      return {
        message: `END Available Reports:
1. Annual Report 2023
2. Financial Statements
3. Audit Report

To download, visit our website or request via SMS.`,
        shouldClose: true,
      }
    }
    
    if (steps[1] === '3') {
      return {
        message: `END Available Forms:
1. Service Request Form
2. Payment Form
3. Complaint Form

To download, visit our website or request via SMS.`,
        shouldClose: true,
      }
    }
    
    if (steps[1] === '4') {
      return {
        message: `END Available Regulations:
1. Building Regulations
2. Health & Safety
3. Environmental

To download, visit our website or request via SMS.`,
        shouldClose: true,
      }
    }
    
    return {
      message: 'END Invalid option selected.',
      shouldClose: true,
    }
  }
  
  /**
   * Handle payment status USSD flow
   */
  private handlePaymentStatus(steps: string[], phoneNumber: string): USSDResponse {
    if (steps.length === 1) {
      return {
        message: `CON Payment Status:
1. Check by Reference
2. Recent Payments
3. Outstanding Payments

0. Back to Main Menu`,
        shouldClose: false,
      }
    }
    
    if (steps[1] === '1') {
      if (steps.length === 2) {
        return {
          message: 'CON Enter Payment Reference:',
          shouldClose: false,
        }
      }
      
      // In production, fetch from database
      const reference = steps[2]
      
      return {
        message: `END Payment Status:
Reference: ${reference}
Amount: ZAR 1,500.00
Status: Paid
Date: 2024-01-15

Thank you for your payment.`,
        shouldClose: true,
      }
    }
    
    if (steps[1] === '2') {
      // In production, fetch from database based on phone number
      return {
        message: `END Recent Payments:
1. INV001 - ZAR 1,500.00 - Paid
2. INV002 - ZAR 2,300.00 - Paid
3. INV003 - ZAR 850.00 - Pending

For details, visit our website.`,
        shouldClose: true,
      }
    }
    
    if (steps[1] === '3') {
      // In production, fetch from database
      return {
        message: `END Outstanding Payments:
1. INV004 - ZAR 3,200.00 - Due 2024-02-15
2. INV005 - ZAR 1,100.00 - Due 2024-02-28

Total Due: ZAR 4,300.00
To pay, visit our website or dial *120*321#`,
        shouldClose: true,
      }
    }
    
    return {
      message: 'END Invalid option selected.',
      shouldClose: true,
    }
  }
  
  /**
   * Get issue type from code
   */
  private getIssueType(code: string): string {
    const types: Record<string, string> = {
      '1': 'Water & Sanitation',
      '2': 'Electricity',
      '3': 'Roads & Streets',
      '4': 'Waste Management',
      '5': 'Other',
    }
    
    return types[code] || 'Other'
  }
  
  /**
   * Send notification for service request status update
   */
  async sendStatusUpdate(
    phoneNumber: string,
    trackingId: string,
    status: string,
    updateMessage: string
  ): Promise<boolean> {
    const message = `CUT GRC Update
Tracking ID: ${trackingId}
Status: ${status}
Update: ${updateMessage}

For more info, visit our website or dial *120*321#`
    
    return this.sendSMS({
      to: phoneNumber,
      message,
    })
  }
  
  /**
   * Send payment receipt
   */
  async sendPaymentReceipt(
    phoneNumber: string,
    reference: string,
    amount: number,
    date: string
  ): Promise<boolean> {
    const message = `Payment Receipt
Reference: ${reference}
Amount: ZAR ${amount.toFixed(2)}
Date: ${date}
Status: Paid

Thank you for your payment.
Keep this receipt for your records.`
    
    return this.sendSMS({
      to: phoneNumber,
      message,
    })
  }
}

export const communicationService = new CommunicationService()