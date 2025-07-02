window.tnConfig = {
    // Address configuration

    apiKey: 'kLGpgEfCX3iUZG16hpI5zrCH9qxcOdahDY1im6ud',
    debug: true,
    addressConfig: {
      defaultCountry: 'US', // Default selected country
      showCountries: ['US', 'CA', 'GB'], // Only show these countries
      dontShowStates: ['AS', 'GU', 'PR', 'VI'], // Hide specific states (e.g. US territories)
      // Or use custom country list
      // countries: [
      //   { code: 'US', name: 'United States' },
      //   { code: 'CA', name: 'Canada' }
      // ]
    },
    // Discounts configuration
    discounts: {
      'SAVE10': {
        code: 'SAVE10',
        type: 'percentage',
        value: 10,
        scope: 'order',
        description: '10% off entire order',
        combinable: true
      },
      'FREESHIP': {
        code: 'FREESHIP',
        type: 'fixed',
        value: 9.99,
        scope: 'order',
        description: 'Free shipping',
        combinable: true
      },
      'SAVE20': {
        code: 'SAVE20',
        type: 'percentage',
        value: 20,
        scope: 'order',
        description: '20% off entire order',
        minOrderValue: 50,
        combinable: false
      },
      'EXPIRED': {
        code: 'EXPIRED',
        type: 'percentage',
        value: 15,
        scope: 'order',
        description: 'Expired coupon',
        validUntil: '2023-01-01'
      }
    },
    // Google Maps configuration
    googleMaps: {
      apiKey: 'AIzaSyBmrv1QRE41P9FhFOTwUhRMGg6LcFH1ehs',
      region: 'US', // Bias results to this region
      enableAutocomplete: true // Enable address autocomplete
    }
  };