// ==========================================================================
// airasia — live currency conversion + interactions
// ==========================================================================

(function () {
  "use strict";

  /* ---------------------------------------------------------------------
     Data
     --------------------------------------------------------------------- */

  // Fallback rates (units of currency per 1 USD). Used if the live feed
  // can't be reached (e.g. offline preview). Overwritten by fetch on load.
  var FALLBACK_RATES = {
    USD: 1,
    BDT: 119.5,
    EUR: 0.92,
    GBP: 0.79,
    MYR: 4.47,
    SGD: 1.31,
    INR: 83.9,
    AUD: 1.52,
    THB: 34.6,
    AED: 3.67
  };

  var CURRENCY_META = {
    USD: { symbol: "$", flag: "$" },
    BDT: { symbol: "৳", flag: "৳" },
    EUR: { symbol: "€", flag: "€" },
    GBP: { symbol: "£", flag: "£" },
    MYR: { symbol: "RM", flag: "RM" },
    SGD: { symbol: "S$", flag: "S$" },
    INR: { symbol: "₹", flag: "₹" },
    AUD: { symbol: "A$", flag: "A$" },
    THB: { symbol: "฿", flag: "฿" },
    AED: { symbol: "د.إ", flag: "AED" }
  };

  var ROUTES = [
    { from: "Dhaka", fromCode: "DAC", to: "Kuala Lumpur", toCode: "KUL", duration: "4h 05m · Direct", priceUSD: 118 },
    { from: "Dhaka", fromCode: "DAC", to: "Bangkok", toCode: "BKK", duration: "3h 10m · Direct", priceUSD: 96 },
    { from: "Dhaka", fromCode: "DAC", to: "Singapore", toCode: "SIN", duration: "4h 40m · Direct", priceUSD: 142 },
    { from: "Dhaka", fromCode: "DAC", to: "Dubai", toCode: "DXB", duration: "5h 20m · Direct", priceUSD: 189 },
    { from: "Dhaka", fromCode: "DAC", to: "Kolkata", toCode: "CCU", duration: "1h 05m · Direct", priceUSD: 41 },
    { from: "Chittagong", fromCode: "CGP", to: "Kuala Lumpur", toCode: "KUL", duration: "4h 45m · 1 stop", priceUSD: 129 }
  ];

  var HOTELS = [
    { name: "Pavilion Hill Hotel", city: "Kuala Lumpur", tag: "Near KLCC", priceUSD: 34 },
    { name: "Riverside Suites", city: "Bangkok", tag: "Free breakfast", priceUSD: 27 },
    { name: "Marina Bay Lodge", city: "Singapore", tag: "Airport shuttle", priceUSD: 58 }
  ];

  /* ---------------------------------------------------------------------
     State
     --------------------------------------------------------------------- */

  var state = {
    rates: Object.assign({}, FALLBACK_RATES),
    currency: "BDT",
    liveFeedOk: false,
    baseUsdBdt: FALLBACK_RATES.BDT // used as the anchor for the ticker animation
  };

  try { const saved=localStorage.getItem('airasia.currency'); if(CURRENCY_META[saved]) state.currency=saved; } catch {}
  var currencySelect = document.getElementById("currencySelect");
  var currencyFlag = document.getElementById("currencyFlag");
  var rateText = document.getElementById("rateText");
  var rateUpdated = document.getElementById("rateUpdated");
  var routeList = document.getElementById("routeList");
  var hotelList = document.getElementById("hotelList");

  /* ---------------------------------------------------------------------
     Formatting
     --------------------------------------------------------------------- */

  function formatAmount(usdAmount, currencyCode) {
    var rate = state.rates[currencyCode] || FALLBACK_RATES[currencyCode] || 1;
    var converted = usdAmount * rate;
    var decimals = converted >= 1000 ? 0 : (currencyCode === "BDT" || currencyCode === "INR" ? 0 : 2);
    var formatted;
    try {
      formatted = new Intl.NumberFormat("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      }).format(converted);
    } catch (e) {
      formatted = converted.toFixed(decimals);
    }
    var meta = CURRENCY_META[currencyCode] || { symbol: currencyCode };
    return meta.symbol + " " + formatted;
  }

  function renderAllPrices() {
    var priceEls = document.querySelectorAll("[data-usd]");
    for (var i = 0; i < priceEls.length; i++) {
      var el = priceEls[i];
      var usd = parseFloat(el.getAttribute("data-usd"));
      el.textContent = formatAmount(usd, state.currency);
      el.classList.remove("flash");
      // eslint-disable-next-line no-unused-expressions
      void el.offsetWidth; // restart animation
      el.classList.add("flash");
    }
    var meta = CURRENCY_META[state.currency] || { flag: state.currency };
    currencyFlag.textContent = meta.flag;
  }

  /* ---------------------------------------------------------------------
     Render routes & hotels
     --------------------------------------------------------------------- */

  function renderRoutes() {
    document.querySelector('#flight h2').textContent='Popular routes';
    document.querySelector('#flight .section-head p').textContent='Explore each destination, choose your flight and book a demo journey.';
    routeList.innerHTML=ROUTES.map((r,i)=>`<article class="route-card">${routePicture(r.toCode)}<div class="route-cities"><span>${r.fromCode}</span><span class="route-line"></span><span>${r.toCode}</span></div><p class="route-meta">${r.from} to ${r.to} · ${r.duration}</p><div class="route-price"><span class="price-label">From / person</span><span class="price" data-usd="${r.priceUSD}"></span></div><button type="button" class="btn btn-primary" data-explore="${i}">Explore flights</button></article>`).join('');
    routeList.querySelectorAll('[data-explore]').forEach(btn=>btn.onclick=()=>exploreRoute(Number(btn.dataset.explore)));
    refreshRoutePictures();renderAllPrices();
  }

  function renderHotels() {
    var swatchColors = ["#2B5A78", "#C99A3E", "#E11D3C"];
    hotelList.innerHTML = HOTELS.map(function (h, i) {
      return (
        '<article class="hotel-card">' +
          '<div class="hotel-swatch" style="background:' + swatchColors[i % 3] + '"><span>' + h.tag + "</span></div>" +
          '<div class="hotel-body">' +
            "<h3>" + h.name + "</h3>" +
            '<p class="hotel-city">' + h.city + "</p>" +
            '<div class="hotel-price">' +
              '<span class="price-label">Per night, from</span>' +
              '<span class="price" data-usd="' + h.priceUSD + '">—</span>' +
            "</div>" +
          "</div>" +
        "</article>"
      );
    }).join("");
  }

  /* ---------------------------------------------------------------------
     Live rate ticker
     --------------------------------------------------------------------- */

  function updateTickerText() {
    var rate = state.rates.BDT || FALLBACK_RATES.BDT;
    rateText.textContent = "1 USD = " + rate.toFixed(2) + " BDT";
    rateUpdated.textContent = state.liveFeedOk ? "live" : "estimated rate";
  }

  function fetchLiveRates() {
    if (!("fetch" in window)) return;
    fetch("https://open.er-api.com/v6/latest/USD")
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data && data.result === "success" && data.rates) {
          Object.keys(CURRENCY_META).forEach(function (code) {
            if (typeof data.rates[code] === "number") {
              state.rates[code] = data.rates[code];
            }
          });
          state.baseUsdBdt = state.rates.BDT;
          state.liveFeedOk = true;
          updateTickerText();
          renderAllPrices();
        }
      })
      .catch(function () {
        // Silently keep fallback rates — offline preview or blocked network.
        state.liveFeedOk = false;
        updateTickerText();
      });
  }

  /* ---------------------------------------------------------------------
     UI wiring
     --------------------------------------------------------------------- */

  currencySelect.value=state.currency;
  currencySelect.addEventListener("change", function () {
    state.currency = currencySelect.value;
    try {localStorage.setItem('airasia.currency',state.currency);} catch {}
    renderAllPrices();
  });

  // Mobile nav toggle
  var navToggle = document.getElementById("navToggle");
  var siteHeader = document.querySelector(".site-header");
  navToggle.addEventListener("click", function () {
    var isOpen = siteHeader.classList.toggle("nav-open");
    navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });
  document.querySelectorAll(".main-nav a").forEach(function (a) {
    a.addEventListener("click", function () {
      siteHeader.classList.remove("nav-open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });

  // Swap origin/destination
  var fromCity = document.getElementById("fromCity");
  var toCity = document.getElementById("toCity");
  document.getElementById("swapCities")?.addEventListener("click", function () {
    var fromVal = fromCity.value;
    if ([].some.call(toCity.options, function (o) { return o.value === fromVal; })) {
      var toVal = toCity.value;
      var tmp = fromVal;
      // Only swap if both cities exist in both lists; otherwise just no-op gracefully.
      if ([].some.call(fromCity.options, function (o) { return o.value === toVal; })) {
        fromCity.value = toVal;
        toCity.value = tmp;
      }
    }
  });

  // Passenger stepper
  var paxCount = document.getElementById("paxCount");
  var pax = 1;
  document.getElementById("paxMinus")?.addEventListener("click", function () {
    pax = Math.max(1, pax - 1);
    paxCount.textContent = pax;
  });
  document.getElementById("paxPlus")?.addEventListener("click", function () {
    pax = Math.min(9, pax + 1);
    paxCount.textContent = pax;
  });

  // Default + minimum dates
  var departInput = document.getElementById("departDate");
  var returnInput = document.getElementById("returnDate");
  var today = new Date().toISOString().split("T")[0];
  if(departInput) departInput.setAttribute("min", today);
  if(returnInput) returnInput.setAttribute("min", today);
  departInput?.addEventListener("change", function () {
    if(returnInput) returnInput.setAttribute("min", departInput.value || today);
  });

  // Booking flow: local-only reservations, with no payment collection.
  const airports = {DAC:'Dhaka',CGP:'Chittagong',KUL:'Kuala Lumpur',SIN:'Singapore',BKK:'Bangkok',DXB:'Dubai',CCU:'Kolkata'};
  [fromCity,toCity].filter(Boolean).forEach(el => { const old=el.value; el.innerHTML=Object.entries(airports).map(([code,name])=>`<option value="${code}">${name} (${code})</option>`).join('');el.value=old; });
  const dateKey = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const localToday=dateKey(new Date());
  if(departInput){departInput.min=localToday; departInput.required=true;}
  const tomorrow=new Date();tomorrow.setDate(tomorrow.getDate()+1);if(departInput) departInput.value=dateKey(tomorrow);
  const later=new Date(tomorrow);later.setDate(later.getDate()+7);if(returnInput) returnInput.value=dateKey(later);
  const tripType=document.getElementById('tripType');
  function updateTrip(){returnInput.disabled=tripType.value==='oneway';returnInput.required=!returnInput.disabled;returnInput.min=departInput.value||localToday;if(returnInput.value<returnInput.min)returnInput.value=returnInput.min;}
  if(tripType){tripType.onchange=updateTrip;departInput.addEventListener('change',updateTrip);updateTrip();}
  const searchNote=document.getElementById('searchNote');
  const dialog=document.getElementById('bookingDialog'), content=document.getElementById('dialogContent');
  document.querySelector('.dialog-close').onclick=()=>dialog.close();
  const esc = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let itinerary=null,selected=[],offers=[],leg=0;
  function loadBookings(){try{const data=JSON.parse(localStorage.getItem('airasia.bookings.v1')||'[]');return Array.isArray(data)?data:[];}catch{return [];}}
  function saveBookings(bookings){try{localStorage.setItem('airasia.bookings.v1',JSON.stringify(bookings));return true;}catch{return false;}}

  function renderBookingLists(){
    const flightList=document.getElementById('flightBookingsList'),hotelList=document.getElementById('hotelBookingsList');
    if(!flightList||!hotelList)return;
    const all=loadBookings().filter(b=>b&&b.ref&&(b.type==='hotel'?b.hotel&&b.stay:Array.isArray(b.flights))).slice().sort((a,b)=>String(b.created||'').localeCompare(String(a.created||'')));
    function render(list,hotel){
      const rows=all.filter(b=>(b.type==='hotel')===hotel);
      document.getElementById(hotel?'hotelBookingCount':'flightBookingCount').textContent='('+rows.length+')';
      list.innerHTML=rows.length?rows.map(b=>{
        const cancelled=b.status==='Cancelled';
        const title=hotel?esc(b.hotel.name):b.flights.map(f=>esc(f.from)+' → '+esc(f.to)).join(' / ');
        const details=hotel?`${esc(b.hotel.city)} · ${esc(b.stay.checkIn)} → ${esc(b.stay.checkOut)} · ${esc(b.stay.rooms)} room(s) · ${esc(b.stay.guests)} guest(s)`:b.flights.map(f=>`${esc(f.date)} at ${esc(f.time)}`).join(' / ')+` · ${(b.passengers||[]).length} passenger(s)`;
        return `<article class="saved-booking"><div class="saved-booking-top"><h3>${title}</h3><span class="booking-status ${cancelled?'is-cancelled':''}">${esc(b.status)}</span></div><p>${details}</p><p><strong>${esc(b.display)} ${esc(b.currency)}</strong></p><div class="booking-actions"><button class="btn btn-primary" data-booking="${esc(b.ref)}" data-action="view">View details</button><button class="btn btn-ghost" data-booking="${esc(b.ref)}" data-action="download">Download</button>${cancelled?'':`<button class="btn btn-ghost" data-booking="${esc(b.ref)}" data-action="cancel">Cancel booking</button>`}</div></article>`;
      }).join(''):`<div class="empty-state"><p>No ${hotel?'hotel':'flight'} bookings yet.</p><a class="btn btn-primary" href="${hotel?'hotel.html':'index.html'}">${hotel?'Find a hotel':'Explore flights'}</a></div>`;
      list.querySelectorAll('[data-booking]').forEach(button=>button.onclick=()=>{
        const booking=loadBookings().find(b=>b.ref===button.dataset.booking);if(!booking){renderBookingLists();return;}
        if(button.dataset.action==='cancel'){
          if(!window.confirm('Cancel this demo reservation?'))return;
          const records=loadBookings(),found=records.find(b=>b.ref===booking.ref);if(!found){renderBookingLists();return;}found.status='Cancelled';
          if(!saveBookings(records)){document.getElementById('bookingsListNote').textContent='Unable to save cancellation. Please try again.';return;}
          renderBookingLists();document.getElementById('bookingsListNote').textContent='Demo booking cancelled.';return;
        }
        showBooking(booking);
        if(button.dataset.action==='download'){document.getElementById(booking.type==='hotel'?'downloadHotel':'downloadBooking').click();dialog.close();}
      });
    }
    render(flightList,false);render(hotelList,true);
  }

  function findRoute(from,to){return ROUTES.find(r=>(r.fromCode===from&&r.toCode===to)||(r.fromCode===to&&r.toCode===from));}
  function drawFlights(){
    const from=leg?itinerary.to:itinerary.from,to=leg?itinerary.from:itinerary.to,date=leg?itinerary.returnDate:itinerary.date;
    const route=findRoute(from,to);
    document.querySelector('#flight h2').textContent=`${leg?'Choose return':'Choose outbound'} · ${from} → ${to}`;
    document.querySelector('#flight .section-head p').textContent=`${date} · ${itinerary.pax} passenger(s) · Sample schedules · Price per passenger`;
    if(!route){routeList.innerHTML='<p class="empty-state">No demo flights for this route. Try Dhaka ↔ Kuala Lumpur, Bangkok, Singapore, Dubai or Kolkata; or Chittagong ↔ Kuala Lumpur.</p>';return;}
    offers=[0,1,2].map(i=>({from,to,date,time:['07:30','13:15','20:00'][i],number:`DEMO-${110+i}`,duration:route.duration,base:route.priceUSD+i*23}));
    routeList.innerHTML=offers.map((f,i)=>`<article class="route-card">${routePicture(f.to)}<div class="route-cities"><span>${f.from}</span><span>→</span><span>${f.to}</span></div><p>${f.date} · ${f.time}</p><p class="route-meta">${f.number} · ${f.duration}</p><p>Economy · 7 kg cabin bag</p><div class="route-price"><span class="price" data-usd="${f.base}"></span><span> / person</span></div><button class="btn btn-primary" data-select="${i}">Select ${leg?'return':'flight'}</button></article>`).join('');renderAllPrices();refreshRoutePictures();
    routeList.querySelectorAll('[data-select]').forEach(btn=>btn.onclick=()=>{selected[leg]=offers[Number(btn.dataset.select)];if(itinerary.trip==='roundtrip'&&leg===0){leg=1;drawFlights();}else openPassengers();});
  }
  document.getElementById('searchForm')?.addEventListener('submit',e=>{
    e.preventDefault();searchNote.textContent='';
    if(fromCity.value===toCity.value){searchNote.textContent='Choose different departure and arrival airports.';return;}
    if(!departInput.value||departInput.value<localToday||(!returnInput.disabled&&returnInput.value<departInput.value)){searchNote.textContent='Choose valid travel dates. Return cannot be before departure.';return;}
    itinerary={from:fromCity.value,to:toCity.value,date:departInput.value,returnDate:returnInput.disabled?null:returnInput.value,trip:tripType.value,pax};selected=[];leg=0;drawFlights();document.getElementById('flight').scrollIntoView({behavior:'smooth'});
  });
  function openPassengers(){
    if(!window.airasiaRequireLogin?.(openPassengers))return;
    content.innerHTML=`<h2 id="dialogTitle">Passenger details</h2><p>Step 1 of 2 · Use sample details for this demo.</p><form id="passengerForm">${Array.from({length:itinerary.pax},(_,i)=>`<fieldset><legend>Passenger ${i+1}</legend><div class="passenger-grid"><label>First name<input name="first${i}" required maxlength="60" autocomplete="off"></label><label>Last name<input name="last${i}" required maxlength="60" autocomplete="off"></label></div></fieldset>`).join('')}<label>Contact email<input type="email" name="email" required maxlength="150" placeholder="you@example.com"></label><label>Checked baggage per passenger<select name="baggage"><option value="0">Cabin bag only · Included</option><option value="25">20 kg · USD 25 per flight</option></select></label><p>No email is sent. Details are stored only in this browser.</p><button class="btn btn-primary">Review booking</button></form>`;
    if(!dialog.open)dialog.showModal();
    document.getElementById('passengerForm').onsubmit=e=>{e.preventDefault();const fd=new FormData(e.target);const passengers=Array.from({length:itinerary.pax},(_,i)=>({first:fd.get('first'+i).trim(),last:fd.get('last'+i).trim()}));if(passengers.some(p=>!p.first||!p.last)){e.target.querySelector('input').setCustomValidity('Enter a name, not only spaces.');e.target.querySelector('input').reportValidity();e.target.querySelector('input').oninput=function(){this.setCustomValidity('');};return;}review(passengers,fd.get('email').trim(),Number(fd.get('baggage')));};
  }
  function review(passengers,email,bag){
    const fare=selected.reduce((sum,f)=>sum+f.base,0)*itinerary.pax, taxes=selected.length*itinerary.pax*12,baggage=bag*selected.length*itinerary.pax,total=fare+taxes+baggage;
    const currency=state.currency,display=formatAmount(total,currency);
    content.innerHTML=`<h2 id="dialogTitle">Review your journey</h2><p>Step 2 of 2 · Demo reservation</p>${selected.map(f=>`<div class="journey"><strong>${f.from} → ${f.to}</strong><p>${f.date} at ${f.time} · ${f.number}</p></div>`).join('')}<p>${passengers.map(p=>esc(p.first+' '+p.last)).join(', ')}</p><p>${esc(email)}</p><dl class="fare-breakdown"><div><dt>Flights</dt><dd>${formatAmount(fare,currency)}</dd></div><div><dt>Sample taxes</dt><dd>${formatAmount(taxes,currency)}</dd></div><div><dt>Checked baggage</dt><dd>${formatAmount(baggage,currency)}</dd></div><div><dt><strong>Total · ${currency}</strong></dt><dd><strong>${display}</strong></dd></div></dl><p>Indicative conversion, fixed for this reservation. No charge, payment or real ticket.</p><p id="saveError" role="alert"></p><div class="booking-actions"><button class="btn btn-ghost" id="editPassengers">Edit details</button><button class="btn btn-primary" id="confirmBooking">Confirm demo booking</button></div>`;
    document.getElementById('editPassengers').onclick=()=>{openPassengers();const form=document.getElementById('passengerForm');passengers.forEach((p,i)=>{form.elements['first'+i].value=p.first;form.elements['last'+i].value=p.last;});form.elements.email.value=email;form.elements.baggage.value=String(bag);};
    document.getElementById('confirmBooking').onclick=function confirmFlight(){if(!window.airasiaRequireLogin?.(confirmFlight))return;const list=loadBookings();let ref;do{ref=Array.from(crypto.getRandomValues(new Uint8Array(6)),n=>'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[n%32]).join('');}while(list.some(b=>b.ref===ref));const booking={ref,status:'Confirmed (demo)',flights:selected.map(f=>({...f})),passengers,email,baggage:bag,totalUSD:total,currency,display,created:new Date().toISOString()};if(!saveBookings([...list,booking])){document.getElementById('saveError').textContent='Could not save. Allow browser storage and try again.';return;}showBooking(booking,true);};
  }
  function showBooking(b, celebrate=false){
    if(b.type==='hotel'){showHotelBooking(b);return;}
    content.innerHTML=`<h2 id="dialogTitle">${b.status==='Cancelled'?'Booking cancelled':'Your demo reservation'}</h2><p class="reference">${esc(b.ref)}</p><p>${esc(b.status)} · No real ticket issued</p>${b.flights.map(f=>`<div class="journey"><strong>${esc(f.from)} → ${esc(f.to)}</strong><p>${esc(f.date)} · ${esc(f.time)} · ${esc(f.number)}</p></div>`).join('')}<p>${b.passengers.map(p=>esc(p.first+' '+p.last)).join(', ')}</p><p>Checked baggage: ${b.baggage?'20 kg per passenger per flight':'None'}</p><p><strong>Total: ${esc(b.display)} ${esc(b.currency)}</strong></p><p>Saved in this browser. Keep your reference and download your itinerary.</p><p id="bookingError" role="alert"></p><div class="booking-actions"><a class="btn btn-ghost" href="bookings.html">Manage booking</a><button class="btn btn-primary" id="downloadBooking">Download itinerary</button>${b.status!=='Cancelled'?'<button class="btn btn-ghost" id="cancelBooking">Cancel booking</button>':''}</div>`;
    if(celebrate && window.airasiaSuccess) window.airasiaSuccess(content);
    if(!dialog.open)dialog.showModal();
    document.getElementById('downloadBooking').onclick=()=>{const text=`DEMO ITINERARY - NOT VALID FOR TRAVEL\nReference: ${b.ref}\nStatus: ${b.status}\n${b.flights.map(f=>`${f.from} -> ${f.to} | ${f.date} ${f.time} | ${f.number}`).join('\n')}\nPassengers: ${b.passengers.map(p=>p.first+' '+p.last).join(', ')}\nContact: ${b.email}\nChecked baggage: ${b.baggage?'20 kg per passenger per flight':'None'}\nTotal: ${b.display} ${b.currency}\nNo payment collected. No ticket issued.`;const url=URL.createObjectURL(new Blob([text],{type:'text/plain'}));const a=document.createElement('a');a.href=url;a.download=`demo-itinerary-${b.ref}.txt`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
    const cancel=document.getElementById('cancelBooking');if(cancel)cancel.onclick=()=>{if(!window.confirm('Cancel this demo reservation?'))return;const list=loadBookings();const found=list.find(x=>x.ref===b.ref);if(!found){document.getElementById('bookingError').textContent='Reservation no longer exists in this browser.';return;}found.status='Cancelled';if(!saveBookings(list)){document.getElementById('bookingError').textContent='Cancellation could not be saved. Try again.';return;}renderBookingLists();showBooking(found);};
  }

  const hotelPhotos=['photo-1566073771259-6a8506099945','photo-1542314831-068cd1dbfeeb','photo-1571896349842-33c89424de2d'];
  function hotelCards(list=HOTELS){
    hotelList.innerHTML=list.length?list.map(h=>{const i=HOTELS.indexOf(h);return `<article class="hotel-card"><img class="hotel-photo" src="https://images.unsplash.com/${hotelPhotos[i]}?w=800&q=80&fit=crop" alt="Illustrative hotel property" loading="lazy" onerror="this.src='assets/stay.svg';this.onerror=null"><div class="hotel-body"><span class="hotel-rating">★★★★ · Sample stay</span><h3>${esc(h.name)}</h3><p class="hotel-city">${esc(h.city)} · ${esc(h.tag)}</p><p>Double room · Up to 2 guests per room</p><div class="hotel-price"><span class="price-label">Per room / night</span><span class="price" data-usd="${h.priceUSD}"></span></div><button class="btn btn-primary" data-hotel="${i}">Book this hotel</button></div></article>`;}).join(''):'<p class="empty-state">No sample hotels in this city. Choose another destination.</p>';
    hotelList.querySelectorAll('[data-hotel]').forEach(btn=>btn.onclick=()=>openHotel(HOTELS[Number(btn.dataset.hotel)]));renderAllPrices();
  }
  const hotelForm=document.getElementById('hotelSearchForm');
  const checkIn=document.getElementById('checkIn'),checkOut=document.getElementById('checkOut');
  if(checkIn){checkIn.min=localToday;checkIn.value=dateKey(tomorrow);const nextDay=new Date(tomorrow);nextDay.setDate(nextDay.getDate()+1);checkOut.value=dateKey(nextDay);}
  function syncStay(){const d=new Date(checkIn.value+'T12:00:00');if(!isNaN(d)){d.setDate(d.getDate()+1);checkOut.min=dateKey(d);if(checkOut.value<checkOut.min)checkOut.value=checkOut.min;}}
  if(checkIn){checkIn.addEventListener('change',syncStay);syncStay();}
  function stayDetails(){const rooms=Number(document.getElementById('hotelRooms').value),guests=Number(document.getElementById('hotelGuests').value);const nights=(Date.parse(checkOut.value)-Date.parse(checkIn.value))/86400000;if(!checkIn.value||checkIn.value<localToday||!Number.isInteger(nights)||nights<1||!Number.isInteger(rooms)||rooms<1||rooms>4||!Number.isInteger(guests)||guests<1||guests>8||guests>rooms*2||guests<rooms)return null;return {checkIn:checkIn.value,checkOut:checkOut.value,nights,rooms,guests};}
  if(hotelForm) hotelForm.onsubmit=e=>{e.preventDefault();const stay=stayDetails();document.getElementById('hotelNote').textContent=stay?`${stay.nights} night(s) · ${stay.rooms} room(s) · ${stay.guests} guest(s)`:'Choose valid dates and 1–2 guests per room.';if(!stay)return;const city=document.getElementById('hotelCity').value;hotelCards(HOTELS.filter(h=>!city||h.city===city));};
  function openHotel(h){
    if(!window.airasiaRequireLogin?.(()=>openHotel(h)))return;
    const stay=stayDetails();if(!stay){document.getElementById('hotelNote').textContent='Choose valid dates and 1–2 guests per room before booking.';hotelForm.scrollIntoView({behavior:'smooth'});hotelForm.reportValidity();return;}
    const roomTotal=h.priceUSD*stay.nights*stay.rooms,tax=roomTotal*.1,total=roomTotal+tax,currency=state.currency,display=formatAmount(total,currency);
    content.innerHTML=`<h2 id="dialogTitle">Book ${esc(h.name)}</h2><p>${esc(h.city)} · ${stay.checkIn} → ${stay.checkOut}</p><p>${stay.nights} night(s) · ${stay.rooms} double room(s) · ${stay.guests} guest(s)</p><form id="hotelGuestForm"><div class="passenger-grid"><label>Lead guest first name<input name="first" required maxlength="60"></label><label>Lead guest last name<input name="last" required maxlength="60"></label></div><label>Contact email<input name="email" type="email" required maxlength="150"></label><dl class="fare-breakdown"><div><dt>Rooms × nights</dt><dd>${formatAmount(roomTotal,currency)}</dd></div><div><dt>Sample tax (10%)</dt><dd>${formatAmount(tax,currency)}</dd></div><div><dt><strong>Total · ${currency}</strong></dt><dd><strong>${display}</strong></dd></div></dl><p>Demo only. No payment, email or real hotel reservation. Use sample details.</p><label class="consent"><input type="checkbox" required> I have reviewed the dates, guests and total.</label><p id="hotelSaveError" role="alert"></p><button class="btn btn-primary">Confirm demo hotel booking</button></form>`;
    dialog.showModal();document.getElementById('hotelGuestForm').onsubmit=function confirmHotel(e){e.preventDefault();if(!window.airasiaRequireLogin?.(()=>confirmHotel(e)))return;const data=new FormData(e.target),first=data.get('first').trim(),last=data.get('last').trim();if(!first||!last){document.getElementById('hotelSaveError').textContent='Enter the lead guest’s first and last name.';return;}const list=loadBookings();let ref;do{ref=Array.from(crypto.getRandomValues(new Uint8Array(6)),n=>'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[n%32]).join('');}while(list.some(b=>b.ref===ref));const b={type:'hotel',ref,status:'Confirmed (demo)',hotel:{name:h.name,city:h.city},stay,passengers:[{first,last}],email:data.get('email').trim(),currency,display,totalUSD:total,created:new Date().toISOString()};if(!saveBookings([...list,b])){document.getElementById('hotelSaveError').textContent='Cannot save. Enable browser storage and try again.';return;}showHotelBooking(b,true);};
  }
  function showHotelBooking(b, celebrate=false){
    content.innerHTML=`<h2 id="dialogTitle">${b.status==='Cancelled'?'Hotel booking cancelled':'Your hotel reservation'}</h2><p class="reference">${esc(b.ref)}</p><p>${esc(b.status)} · Demo only</p><div class="journey"><strong>${esc(b.hotel.name)}</strong><p>${esc(b.hotel.city)} · ${esc(b.stay.checkIn)} → ${esc(b.stay.checkOut)}</p><p>${b.stay.nights} night(s) · ${b.stay.rooms} room(s) · ${b.stay.guests} guest(s)</p></div><p>Lead guest: ${esc(b.passengers[0].first)} ${esc(b.passengers[0].last)}</p><p><strong>Total: ${esc(b.display)} ${esc(b.currency)}</strong></p><p>Saved in this browser. No real hotel reservation or payment.</p><p id="hotelBookingError" role="alert"></p><div class="booking-actions"><a class="btn btn-ghost" href="bookings.html">Manage booking</a><button class="btn btn-primary" id="downloadHotel">Download confirmation</button>${b.status==='Cancelled'?'':'<button class="btn btn-ghost" id="cancelHotel">Cancel hotel booking</button>'}</div>`;
    if(celebrate && window.airasiaSuccess) window.airasiaSuccess(content);
    if(!dialog.open)dialog.showModal();
    document.getElementById('downloadHotel').onclick=()=>{const text=`DEMO HOTEL CONFIRMATION — NOT VALID FOR CHECK-IN\nReference: ${b.ref}\nStatus: ${b.status}\n${b.hotel.name}, ${b.hotel.city}\nCheck-in: ${b.stay.checkIn}\nCheck-out: ${b.stay.checkOut}\n${b.stay.nights} nights | ${b.stay.rooms} rooms | ${b.stay.guests} guests\nLead guest: ${b.passengers[0].first} ${b.passengers[0].last}\nTotal: ${b.display} ${b.currency}\nNo payment collected. No real reservation.`;const url=URL.createObjectURL(new Blob([text],{type:'text/plain'})),a=document.createElement('a');a.href=url;a.download=`demo-hotel-${b.ref}.txt`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
    const cancel=document.getElementById('cancelHotel');if(cancel)cancel.onclick=()=>{if(!window.confirm('Cancel this demo hotel reservation?'))return;const list=loadBookings(),found=list.find(x=>x.ref===b.ref);if(!found){document.getElementById('hotelBookingError').textContent='Booking not found in this browser.';return;}found.status='Cancelled';if(!saveBookings(list)){document.getElementById('hotelBookingError').textContent='Unable to save cancellation. Try again.';return;}renderBookingLists();showHotelBooking(found);};
  }

  // Destination photographs follow the arrival airport, including swaps.
  const destinations={
    DAC:{city:'Dhaka',country:'Bangladesh',landmark:'Lalbagh Fort',article:'Lalbagh_Fort',initial:'https://www.pearlhotelbd.com/images/lalbagh-fort.jpg'},
    CGP:{city:'Chittagong',country:'Bangladesh',landmark:"Foy’s Lake",article:"Foy%27s_Lake",initial:'https://3.bp.blogspot.com/-n7uEULWh1Qk/WeMXhNDrE3I/AAAAAAAAGKg/EoTX4HLFbLUz3G84U3t_-F3GEVonqwJdgCLcBGAs/s1600/19059304_10154717772313861_2582015044838452539_n.jpg',source:'https://worldheritagebd.blogspot.com/2017/10/foys-lake.html'},
    KUL:{city:'Kuala Lumpur',country:'Malaysia',landmark:'Petronas Towers at night',article:'Petronas_Towers',initial:'assets/kuala-lumpur.jpg',source:'about.html#photo-credits'},
    SIN:{city:'Singapore',country:'Singapore',landmark:'Marina Bay Sands',article:'Marina_Bay_Sands'},
    BKK:{city:'Bangkok',country:'Thailand',landmark:'Wat Arun',article:'Wat_Arun'},
    DXB:{city:'Dubai',country:'United Arab Emirates',landmark:'Burj Khalifa',article:'Burj_Khalifa'},
    CCU:{city:'Kolkata',country:'India',landmark:'Victoria Memorial',article:'Victoria_Memorial,_Kolkata'}
  };
  let destinationRevision=0;
  const destinationCache={};
  function updateDestination(){
    const code=toCity.value,d=destinations[code];if(!d)return;
    const revision=++destinationRevision;
    const background=document.querySelector('.hero-background'),photo=document.querySelector('.hero-postcard img'),caption=document.querySelector('.postcard-caption strong'),city=document.querySelector('.postcard-caption span'),credit=document.querySelector('.destination-credit');
    caption.textContent=d.landmark;city.textContent=d.city+' · '+d.country;
    const source='https://en.wikipedia.org/wiki/'+d.article;
    function setPhoto(url){[background,photo].forEach(img=>{
      if(window.airasiaCrossfade)window.airasiaCrossfade(img,url,d.landmark+' in '+d.city);
      else {img.src=url;img.alt=d.landmark+' in '+d.city;}
    });}
    credit.href=code==='DAC'?'https://www.pearlhotelbd.com/about-us/blog/family-friendly-activities-with-kids':source;if(d.source)credit.href=d.source;credit.textContent='Photo source';
    setPhoto(destinationCache[code]||d.initial||'assets/destination.svg');
    if(!destinationCache[code]&&!d.initial){photo.alt=background.alt=d.city+' — loading destination photo';}
    if(!d.initial&&typeof fetch==='function')fetch('https://en.wikipedia.org/w/api.php?origin=*&action=query&format=json&prop=pageimages&piprop=thumbnail&pithumbsize=1400&titles='+encodeURIComponent(d.article))
      .then(r=>{if(!r.ok)throw Error('Image unavailable');return r.json();})
      .then(data=>{const page=Object.values(data.query?.pages||{})[0];const url=page?.thumbnail?.source;if(!url)return;destinationCache[code]=url;if(revision!==destinationRevision)return;setPhoto(url);credit.href=source;credit.textContent='Photo & credits · Wikimedia';})
      .catch(()=>{if(revision===destinationRevision&&!d.initial&&!destinationCache[code])photo.alt=background.alt=d.city+' — destination photo unavailable';});
  }
  toCity?.addEventListener('change',updateDestination);
  document.getElementById('swapCities')?.addEventListener('click',updateDestination);
  if(toCity) updateDestination();

  function destinationPhoto(code){
    const d=destinations[code];return destinationCache[code]||d.initial||'assets/destination.svg';
  }
  function destinationCredit(code){const d=destinations[code];return d.source||'https://en.wikipedia.org/wiki/'+d.article;}
  const photoRequests={};
  function loadDestinationPhoto(code){
    const d=destinations[code];
    if(d.initial||destinationCache[code])return Promise.resolve(destinationPhoto(code));
    if(typeof fetch!=='function')return Promise.resolve('assets/destination.svg');
    if(!photoRequests[code])photoRequests[code]=fetch('https://en.wikipedia.org/w/api.php?origin=*&action=query&format=json&prop=pageimages&piprop=thumbnail&pithumbsize=1400&titles='+encodeURIComponent(d.article))
      .then(r=>{if(!r.ok)throw Error('Photo unavailable');return r.json();})
      .then(data=>{const url=Object.values(data.query?.pages||{})[0]?.thumbnail?.source;if(url)destinationCache[code]=url;return url||'assets/destination.svg';}).catch(()=> 'assets/destination.svg');
    return photoRequests[code];
  }
  function routePicture(code){const d=destinations[code];return `<img class="flight-photo" data-destination="${code}" src="${esc(destinationPhoto(code))}" alt="${esc(d.landmark+' · '+d.city)}" loading="lazy" onerror="this.onerror=null;this.src='assets/destination.svg';this.alt='Destination photo unavailable'"><a class="route-photo-credit" href="${esc(destinationCredit(code))}" target="_blank" rel="noopener">${esc(d.landmark)} · Photo source</a>`;}
  function refreshRoutePictures(){document.querySelectorAll('[data-destination]').forEach(img=>{const code=img.dataset.destination;loadDestinationPhoto(code).then(url=>{if(img.isConnected){img.src=url;if(url==='assets/destination.svg')img.alt='Destination photo unavailable';}});});}
  function exploreRoute(index){
    const r=ROUTES[index];
    content.innerHTML=`<h2 id="dialogTitle">Explore ${esc(r.to)}</h2>${routePicture(r.toCode)}<div class="journey"><strong>${r.from} (${r.fromCode}) → ${r.to} (${r.toCode})</strong><p>${r.duration} · Economy · 7 kg cabin baggage</p><p>Three sample departures daily. No real airline ticket is issued.</p></div><form id="exploreForm"><div class="passenger-grid"><label>Trip type<select id="exploreTrip"><option value="oneway">One way</option><option value="roundtrip">Round trip</option></select></label><label>Passengers<input id="explorePax" type="number" min="1" max="9" value="${pax}" required></label><label>Departure date<input id="exploreDate" type="date" min="${localToday}" value="${departInput.value||dateKey(tomorrow)}" required></label><label>Return date<input id="exploreReturn" type="date" value="${returnInput.value}" disabled></label><label>Outbound flight<select id="exploreTime">${[0,1,2].map(i=>`<option value="${i}">${['07:30','13:15','20:00'][i]} · ${formatAmount(r.priceUSD+i*23,state.currency)} / person</option>`).join('')}</select></label><label>Return flight<select id="exploreReturnTime" disabled>${[0,1,2].map(i=>`<option value="${i}">${['07:30','13:15','20:00'][i]} · ${formatAmount(r.priceUSD+i*23,state.currency)} / person</option>`).join('')}</select></label></div><p id="exploreTotal" class="explore-total" aria-live="polite"></p><p>Includes sample taxes of USD 12 per passenger per flight. Optional checked baggage is added during checkout.</p><p id="exploreError" role="alert"></p><button class="btn btn-primary" type="submit">Book this flight</button></form>`;
    if(!dialog.open)dialog.showModal();refreshRoutePictures();
    const trip=document.getElementById('exploreTrip'),out=document.getElementById('exploreDate'),back=document.getElementById('exploreReturn'),count=document.getElementById('explorePax'),time=document.getElementById('exploreTime'),backTime=document.getElementById('exploreReturnTime');
    trip.value=tripType.value;time.value='0';backTime.value='0';
    function updateExplore(){const round=trip.value==='roundtrip';back.disabled=backTime.disabled=!round;back.required=round;back.min=out.value||localToday;if(back.value<back.min)back.value=back.min;const n=Number(count.value);const base=r.priceUSD+Number(time.value)*23+(round?r.priceUSD+Number(backTime.value)*23:0),tax=12*(round?2:1);document.getElementById('exploreTotal').textContent=Number.isInteger(n)&&n>=1&&n<=9?`Total for ${n} passenger(s): ${formatAmount((base+tax)*n,state.currency)} ${state.currency}`:'Choose 1–9 passengers.';}
    [trip,out,back,count,time,backTime].forEach(el=>el.addEventListener('input',updateExplore));updateExplore();
    document.getElementById('exploreForm').onsubmit=e=>{e.preventDefault();const n=Number(count.value),round=trip.value==='roundtrip';if(!out.value||out.value<localToday||(round&&(!back.value||back.value<out.value))||!Number.isInteger(n)||n<1||n>9){document.getElementById('exploreError').textContent='Choose valid dates and 1–9 passengers.';return;}
      itinerary={from:r.fromCode,to:r.toCode,date:out.value,returnDate:round?back.value:null,trip:trip.value,pax:n};
      const makeFlight=(i,returning)=>({from:returning?r.toCode:r.fromCode,to:returning?r.fromCode:r.toCode,date:returning?back.value:out.value,time:['07:30','13:15','20:00'][i],number:`DEMO-${110+i}`,duration:r.duration,base:r.priceUSD+i*23});
      selected=[makeFlight(Number(time.value),false)];if(round)selected.push(makeFlight(Number(backTime.value),true));
      fromCity.value=r.fromCode;toCity.value=r.toCode;departInput.value=out.value;tripType.value=trip.value;if(round)returnInput.value=back.value;pax=n;paxCount.textContent=n;updateTrip();updateDestination();openPassengers();
    };
  }

  function renderFeaturedDeals(){
    const deals=[{index:0,tag:'SUPER SAVER'},{index:2,tag:'CITY ESCAPE'},{index:3,tag:'SUNSHINE GETAWAY'},{index:1,tag:'BEST SELLER'}];
    const container=document.getElementById('featuredDeals');
    container.innerHTML=deals.map(({index,tag})=>{const r=ROUTES[index];return `<article class="deal-card"><span class="deal-tag">${tag}</span><div class="deal-route"><h3>${esc(r.from)}<span>(${r.fromCode})</span></h3><span class="deal-arrow" aria-hidden="true">→</span><h3>${esc(r.to)}<span>(${r.toCode})</span></h3></div><p class="deal-description">${esc(r.duration)} · Includes 7 kg cabin baggage</p><div class="deal-bottom"><div><span class="deal-price-label">From / person · incl. sample tax</span><strong class="deal-price" data-usd="${r.priceUSD+12}"></strong></div><button class="deal-book" type="button" data-deal="${index}" aria-label="Book deal from ${esc(r.from)} to ${esc(r.to)}">Book Deal</button></div></article>`;}).join('');
    container.querySelectorAll('[data-deal]').forEach(button=>button.onclick=()=>exploreRoute(Number(button.dataset.deal)));
  }

  document.getElementById('allRoutes')?.addEventListener('click',renderRoutes);
  /* ---------------------------------------------------------------------
     Init
     --------------------------------------------------------------------- */

  if(routeList) renderRoutes();
  if(document.getElementById('featuredDeals')) renderFeaturedDeals();
  if(hotelList) hotelCards();
  updateTickerText();
  renderAllPrices();
  fetchLiveRates();
  renderBookingLists();
  window.addEventListener('storage', e=>{if(e.key==='airasia.bookings.v1'||e.key===null)renderBookingLists();});



  setInterval(fetchLiveRates, 5 * 60 * 1000); // re-sync with real rates every 5 minutes
})();
