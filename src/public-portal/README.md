# CUT GRC Public Portal

Citizen self-service portal for Central University of Technology's Governance, Risk, and Compliance platform.

## Features

### Citizen Self-Service
- Service request submission interface
- Document access for public records
- Payment integration for municipal services
- Multi-language interface (11 South African languages)

### Multi-Channel Access
- USSD interface for feature phones
- WhatsApp integration for citizen communication
- SMS notification system
- Kiosk/municipal office access points

### Payment Integration
- South African payment gateways (PayFast, Ozow)
- Mobile money integration (M-Pesa where available)
- Payment tracking and reconciliation
- Receipt generation and delivery

### Accessibility & Inclusion
- WCAG 2.1 AA compliance
- Assistive technology support
- Low-bandwidth optimization
- Feature phone compatibility

## Technology Stack

- **Framework:** React 18+ with TypeScript
- **Styling:** Tailwind CSS
- **State Management:** React Query + Zustand
- **Internationalization:** i18next
- **Payment Integration:** PayFast, Ozow SDKs
- **Multi-channel:** Twilio API, WhatsApp Business API

## Development

### Setup
```bash
cd src/public-portal
npm install
npm run dev
```

### Building for Production
```bash
npm run build
npm run preview
```

## Language Support

The portal supports 11 official South African languages:
1. English
2. Afrikaans
3. isiZulu
4. isiXhosa
5. Sepedi
6. Setswana
7. Sesotho
8. Xitsonga
9. siSwati
10. Tshivenda
11. isiNdebele

## Accessibility

All components are built with WCAG 2.1 AA compliance in mind:
- Semantic HTML structure
- ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility
- Color contrast compliance