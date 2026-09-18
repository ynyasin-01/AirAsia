# AirAsia — Flight & Hotel Booking Demo

A responsive, AirAsia-inspired travel booking website built with **HTML, CSS, and vanilla JavaScript**. Explore destinations, compare sample flights, book demo hotel stays, and manage reservations through a light glassmorphism interface.

> **Educational project:** This website is not affiliated with AirAsia. All flights, hotel listings, schedules, and fares are illustrative. No real reservations, payments, or tickets are issued.

## Features

### Flights

- One-way and round-trip searches with date validation.
- Support for 1–9 passengers.
- Popular route cards with destination photographs.
- **Explore flights** panels with schedules, prices, and direct booking.
- Featured deals connected to the booking flow.
- Passenger details, optional checked baggage, and price breakdowns.
- Confirmation references and downloadable text itineraries.

### Hotels

- Sample hotels in Kuala Lumpur, Bangkok, and Singapore.
- Check-in/check-out dates and automatic night calculations.
- Selection of 1–4 rooms and 1–8 guests, with 1–2 guests per room.
- Lead guest details and a total including sample tax.
- Downloadable booking confirmations.

### Booking management

- Retrieve flight and hotel reservations using a six-character booking reference.
- Cancel demo reservations.
- Save booking records in the browser using `localStorage`.

### Design and usability

- Transparent glass hero, header, footer, and booking dialogs.
- Destination images that follow the selected arrival airport.
- Flight and hotel card hover effects and an animated logo.
- Responsive forms, navigation, and buttons for smaller screens.
- Keyboard focus indicators and reduced-motion support.
- Ten display currencies with a public exchange-rate feed and estimated fallback rates.

## Technology

| Technology | Purpose |
| --- | --- |
| HTML5 | Page structure and forms |
| CSS3 | Glass effects, responsive layouts, and animations |
| JavaScript | Search, price calculations, and booking interactions |
| Browser `localStorage` | Same-browser reservation persistence |
| Netlify | Static hosting configuration |

No framework, package installation, build command, or API key is required.

## Getting started

1. Download or clone the repository.
2. Keep all files and the `assets` folder together.
3. Open `index.html` in a modern browser.

For a consistent local development address, you can serve the project with Python:

```bash
python -m http.server 8000
```

Then visit [localhost:8000](http://localhost:8000).

Internet access is needed for remote photographs, web fonts, and exchange-rate updates. Bundled illustrations and estimated rates provide fallbacks.

## How to book

### Flight reservation

1. Choose your departure and arrival airports.
2. Select the trip type, travel dates, and passenger count.
3. Search and select an outbound flight, plus a return flight when applicable.
4. Enter sample passenger details and choose optional baggage.
5. Review the total and confirm the demo booking.
6. Save your booking reference or download the itinerary.

You can also use **Explore flights** on a popular route or **Book Deal** on a featured offer to enter the booking flow directly.

### Hotel reservation

1. Choose a destination, stay dates, rooms, and guests.
2. Click **Search hotels**, then **Book this hotel**.
3. Enter sample lead guest details and review the total.
4. Confirm the demo reservation and save its reference.

### Find or cancel a reservation

Open **Bookings**, enter the booking reference, and select **Find my booking**. From the reservation dialog, download the itinerary or confirmation, or cancel the booking.

## Supported sample flight routes

All routes support travel in both directions.

| Departure | Arrival |
| --- | --- |
| Dhaka (DAC) | Kuala Lumpur (KUL) |
| Dhaka (DAC) | Bangkok (BKK) |
| Dhaka (DAC) | Singapore (SIN) |
| Dhaka (DAC) | Dubai (DXB) |
| Dhaka (DAC) | Kolkata (CCU) |
| Chittagong (CGP) | Kuala Lumpur (KUL) |

Other airport combinations display a no-results message.

## Project files

| File | Purpose |
| --- | --- |
| `index.html` | Main page and form markup |
| `styles.css` | Theme, component styling, and animations |
| `mobile.css` | Phone and tablet layout adjustments |
| `script.js` | Sample data and application behavior |
| `assets/` | Fallback destination, flight, and hotel illustrations |
| `netlify.toml` | Static hosting and response-header configuration |
| `README.md` | Project documentation |

Load `mobile.css` after `styles.css` and include both files when deploying.

## Deploy to Netlify

### Manual deployment

1. Extract the project ZIP if necessary.
2. Upload the project folder through Netlify's manual deployment interface.
3. Ensure `index.html` is at the root of the uploaded folder.
4. Include `styles.css`, `mobile.css`, `script.js`, `netlify.toml`, and `assets/`.

### Git deployment

Connect the repository to Netlify using these settings:

| Setting | Value |
| --- | --- |
| Build command | Leave empty |
| Publish directory | `.` |

The included `netlify.toml` already sets the publish directory to the project root.

## Demo limitations

- No backend, account registration, login, or secure authentication.
- No live airline inventory, real hotel availability, payment processing, or email delivery.
- Bookings remain in the browser and site address where they were created. They do not sync across devices or between local and deployed versions.
- Clearing browser storage removes saved reservations. Private browsing may not retain them.
- Booking references are lookup identifiers, not an authentication mechanism.
- Currency conversions are indicative. Sample prices and schedules are not real travel offers.
- Downloaded itineraries and confirmations are text files, not valid travel documents.

Use sample personal details when trying the booking flow.

## Images and external resources

Destination and hotel images are illustrative. Remote photographs may fail to load when offline or when a provider blocks access; the site then uses bundled illustrations.

Image sources include:

- [Wikimedia Commons](https://commons.wikimedia.org/) and destination pages on [Wikipedia](https://en.wikipedia.org/).
- [Petronas Towers night photograph](https://commons.wikimedia.org/wiki/File:Kuala_Lumpur-Petronas_Towers-Night_View.jpg).
- [Dhaka / Lalbagh Fort travel guide](https://www.pearlhotelbd.com/about-us/blog/family-friendly-activities-with-kids).
- [Chittagong / Foy’s Lake photograph](https://worldheritagebd.blogspot.com/2017/10/foys-lake.html).
- [Unsplash](https://unsplash.com/) for illustrative hotel photographs.

The project also uses [Google Fonts](https://fonts.google.com/) and a [public USD exchange-rate endpoint](https://open.er-api.com/v6/latest/USD).

Third-party photographs, fonts, and branding retain their respective ownership and usage terms. A license for the project code does not grant rights to those materials.

## Validation

JavaScript syntax and selected booking logic have been checked, including flight checkout, round-trip totals, hotel date and occupancy validation, booking lookup, and cancellation. Logic checks used DOM stubs. Full browser, device, and visual testing remains to be completed.

## License

No project license has been selected yet. Add a `LICENSE` file to the repository to specify the permissions you intend to grant for code you have the right to license.
