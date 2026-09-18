# AirAsia frontend booking demo

Open index.html in a modern browser. No install or build is required.

## Deploy to Netlify
Extract this ZIP, then drag the extracted folder (containing index.html, styles.css, script.js and netlify.toml) into Netlify's manual deploy area. For Git deployment, leave the build command empty and use `.` as the publish directory.

## Book a demo flight
1. Choose one way or round trip, airports, dates and 1–9 passengers.
2. Click Search flights and select an outbound flight (and a return for round trips).
3. Enter sample passenger names and a contact email; choose optional baggage.
4. Review the fare, sample taxes and baggage total, then confirm.
5. Save the reference or download the text itinerary.
6. Under Bookings, enter the booking reference only to view or cancel.

Supported demo routes, in both directions: Dhaka–Kuala Lumpur, Dhaka–Bangkok, Dhaka–Singapore, Dhaka–Dubai, Dhaka–Kolkata, Chittagong–Kuala Lumpur. Other pairs show an empty result.

Reservations use localStorage and persist only in this browser and origin. Clearing browser data deletes them. No authentication, server, real payment, email delivery, live flight inventory, real ticket or cross-device synchronization is included. Hotel booking instructions appear below. Use sample personal information. This independent educational project is not affiliated with AirAsia.

Currency rates use a public feed with an estimated fallback. The displayed amount is fixed when reviewing a reservation. Prices, taxes and schedules are sample data. Real ticket sales require a server-side airline/provider integration, secure authentication, payments and ticket issuance.

## Hotels and visual update
Choose a hotel destination, check-in/check-out, rooms (1–4) and guests (1–8, with 1–2 per room). Click Book this hotel, enter lead guest details, review the total and confirm. Use the booking booking reference only under Bookings to retrieve or cancel. Download confirmation from the reservation dialog. Hotels and flights are demo reservations only; no payment, email, real ticket or actual hotel booking is made.

The glass hero and cards use a red/white/charcoal palette. Online photos are from images.unsplash.com and are illustrative. Bundled SVG illustrations appear if photos cannot load. Include the assets folder when deploying to Netlify.

## Transparent glass update
Light glass dialogs, header and footer have explicit readable text and light controls, including on dark-mode devices. The hero follows the To airport and swap action. Photos load from Wikipedia/Wikimedia with source links; the initial Dhaka image is Lalbagh Fort from https://www.pearlhotelbd.com/about-us/blog/family-friendly-activities-with-kids . Internet is required for remote photos; a bundled destination illustration appears if unavailable. Manage both flight and hotel demo bookings using only the six-character reference in the same browser.

## Explore flights update
Popular route cards now use destination landmark photographs. Explore flights opens route details, one-way/round-trip dates, passenger count, three departure choices per direction and a total including sample taxes. Book this flight continues directly to passenger details and the existing confirmation flow. View all popular routes restores the cards after a search.

Kuala Lumpur: Petronas Towers at night, https://commons.wikimedia.org/wiki/File:Kuala_Lumpur-Petronas_Towers-Night_View.jpg (CC0). Chittagong: Foy’s Lake, photo/source: https://worldheritagebd.blogspot.com/2017/10/foys-lake.html . Other destination images use their linked Wikipedia/Wikimedia pages. Online photos require network access; a neutral destination illustration appears if unavailable.

Validation: JavaScript syntax and booking logic checked, including direct two-passenger round-trip booking, flight total, hotel checkout and cancellation. Logic checks used DOM stubs; visual browser checks were not available.

## Hover and logo update
Flight/hotel cards lift with a soft shadow and richer images on pointer hover. Booking buttons and passenger controls provide hover/press feedback. The logo animates on entry and reacts to hover/focus. Reduced-motion preferences disable movement. Trip-type text, passenger count and plus/minus controls use explicit dark text on light glass backgrounds.

## Featured deals and benefits
Replaced the previous About statistics with four Featured Flight Deals and three Why Book with AirAsia cards, following the supplied layout. Deals use supported sample routes to Kuala Lumpur, Singapore, Dubai and Bangkok. Displayed starting prices include the USD 12 sample tax and follow the selected currency. Book Deal opens the existing Explore flights flow. Cards stack for tablet/mobile and respect reduced-motion settings.

## Phone layout fixes
mobile.css is loaded after styles.css and must be included in deployment. Header uses a three-column mobile layout. Search controls shrink safely and stack on narrow phones. Buttons wrap long labels and have touch-friendly heights. Booking dialog fields and actions stack on phones. Native date controls have explicit minimum widths; footer links and deal actions wrap. JavaScript booking logic is unchanged.
