console.log("SCRIPT LOADED");
(() => {
  'use strict'

  // Fetch all the forms we want to apply custom Bootstrap validation styles to
  const forms = document.querySelectorAll('.needs-validation')

  // Loop over them and prevent submission
  Array.from(forms).forEach(form => {
    form.addEventListener('submit', event => {
      if (!form.checkValidity()) {
        event.preventDefault()
        event.stopPropagation()
      }

      form.classList.add('was-validated')
    }, false)
  })

  const taxToggle = document.querySelector('#tax-toggle-input')
  const listingPrices = document.querySelectorAll('.listing-price')
  const taxRate = 0.18
  const formatter = new Intl.NumberFormat('en-IN')

  if (taxToggle) {
    taxToggle.addEventListener('change', () => {
      listingPrices.forEach(priceElement => {
        const basePrice = Number(priceElement.dataset.basePrice)
        const displayedPrice = taxToggle.checked
          ? basePrice * (1 + taxRate)
          : basePrice

        priceElement.querySelector('.price-amount').textContent = formatter.format(displayedPrice)
        priceElement.querySelector('.price-tax-label').textContent = taxToggle.checked
          ? 'incl. taxes'
          : 'before taxes'
      })
    })
  }

  const listingsPage = document.querySelector('.listings-page[data-active-category]')
  const searchForm = document.querySelector('.listing-search')
  const searchInput = document.querySelector('#listing-search-input')
  const listingCards = document.querySelectorAll('.listing-result-card')
  const noListings = document.querySelector('.no-listings')
  const resultsCount = document.querySelector('#listings-results')

  if (listingsPage && searchForm && searchInput) {
    const filterListings = () => {
      const query = searchInput.value.trim().toLowerCase()
      const activeCategory = listingsPage.dataset.activeCategory
      let visibleCount = 0

      listingCards.forEach(card => {
        const matchesSearch = !query || card.dataset.searchText.includes(query)
        const matchesCategory = !activeCategory || card.dataset.category === activeCategory
        const isVisible = matchesSearch && matchesCategory

        card.hidden = !isVisible
        if (isVisible) visibleCount += 1
      })

      resultsCount.textContent = `${visibleCount} ${visibleCount === 1 ? 'stay' : 'stays'} found`
      noListings.hidden = visibleCount !== 0
    }

    searchInput.addEventListener('input', filterListings)
    searchForm.addEventListener('submit', event => {
      event.preventDefault()
      filterListings()
    })
    filterListings()
  }

  const uploadForms = document.querySelectorAll('form[enctype="multipart/form-data"]')

  const optimizeImage = async (file) => {
    if (!file || !file.type.startsWith('image/') || file.size < 750 * 1024) return file

    const image = await createImageBitmap(file)
    const maxDimension = 1600
    const scale = Math.min(1, maxDimension / Math.max(image.width, image.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(image.width * scale)
    canvas.height = Math.round(image.height * scale)
    canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height)
    image.close()

    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.82))
    if (!blob) return file

    return new File([blob], `${file.name.replace(/\.[^.]+$/, '')}.jpg`, {
      type: 'image/jpeg',
      lastModified: Date.now(),
    })
  }

  uploadForms.forEach(form => {
    form.addEventListener('submit', async event => {
      const fileInput = form.querySelector('input[type="file"][name="image"]')
      const file = fileInput?.files?.[0]
      if (!file || !form.checkValidity()) return

      event.preventDefault()
      const submitButton = form.querySelector('button[type="submit"]')
      const originalButtonText = submitButton?.textContent

      if (submitButton) {
        submitButton.disabled = true
        submitButton.textContent = 'Uploading image...'
      }

      try {
        const optimizedFile = await optimizeImage(file)
        const files = new DataTransfer()
        files.items.add(optimizedFile)
        fileInput.files = files.files
        HTMLFormElement.prototype.submit.call(form)
      } catch (error) {
        if (submitButton) {
          submitButton.disabled = false
          submitButton.textContent = originalButtonText
        }
        console.error('Image optimization failed:', error)
      }
    })
  })
})()