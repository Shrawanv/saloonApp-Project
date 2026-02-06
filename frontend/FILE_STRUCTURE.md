# Salon Queue App - File Structure

```
salon-queue-app/
├── index.html
├── package.json
├── vite.config.js
├── FILE_STRUCTURE.md
│
└── src/
    ├── main.jsx                    # App entry point
    ├── App.jsx                     # Root router & routes
    │
    ├── styles/
    │   └── index.css               # Global styles, CSS variables
    │
    ├── layouts/
    │   ├── CustomerLayout.jsx      # Customer app layout (header nav)
    │   ├── CustomerLayout.css
    │   ├── VendorLayout.jsx        # Vendor app layout (sidebar)
    │   └── VendorLayout.css
    │
    ├── pages/
    │   ├── auth/
    │   │   ├── LoginPage.jsx       # OTP/Password/Social/Guest login
    │   │   └── LoginPage.css
    │   │
    │   ├── customer/
    │   │   ├── SalonSelect.jsx     # QR scan + Search salons
    │   │   ├── SalonSelect.css
    │   │   ├── CustomerDashboard.jsx  # Tabbed dashboard (Profile, Queue, Book, etc.)
    │   │   ├── CustomerDashboard.css
    │   │   ├── MyAppointments.jsx  # Upcoming + Past appointments
    │   │   └── MyAppointments.css
    │   │
    │   └── vendor/
    │       ├── VendorHome.jsx      # Welcome + chart placeholders
    │       ├── VendorHome.css
    │       ├── BookingQueue.jsx    # Live queue, slots, walk-in
    │       ├── BookingQueue.css
    │       ├── PaymentBilling.jsx  # Accept payment, Generate bill
    │       ├── PaymentBilling.css
    │       ├── Communication.jsx   # Chat, appointments, broadcast
    │       ├── Communication.css
    │       ├── Reports.jsx         # Ratings, customers, earnings
    │       ├── Reports.css
    │       ├── GalleryBranding.jsx # Portfolio, social handles
    │       ├── GalleryBranding.css
    │       ├── SettingsSupport.jsx # Language, support, FAQ
    │       ├── SettingsSupport.css
    │       ├── VendorProfile.jsx   # Business, services, staff
    │       └── VendorProfile.css
    │
    └── components/
        └── customer/
            ├── SalonProfile.jsx    # About + Staff profiles
            ├── SalonProfile.css
            ├── LiveQueue.jsx       # Real-time queue + Join
            ├── LiveQueue.css
            ├── BookSlot.jsx        # Service, date, slot picker
            ├── BookSlot.css
            ├── PriceList.jsx       # Service price table
            ├── PriceList.css
            ├── RatingSection.jsx   # Avg rating + Rate salon
            ├── RatingSection.css
            ├── FeedbackSection.jsx # Give + view feedback
            └── FeedbackSection.css
```

## Route Structure

| Path | Page |
|------|------|
| `/login` | Login (Customer/Vendor) |
| `/customer/select-salon` | Find salon (QR/Search) |
| `/customer/dashboard/:salonId` | Salon dashboard with tabs |
| `/customer/appointments` | My appointments |
| `/vendor` | Vendor home |
| `/vendor/booking-queue` | Booking & queue mgmt |
| `/vendor/payment-billing` | Payment & billing |
| `/vendor/communication` | Communication tools |
| `/vendor/reports` | Reports |
| `/vendor/gallery-branding` | Gallery & branding |
| `/vendor/settings-support` | Settings & support |
| `/vendor/profile` | Vendor profile |

## Run the App

```bash
cd salon-queue-app
npm install
npm run dev
```
