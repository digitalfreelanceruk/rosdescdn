window.addEventListener('DOMContentLoaded', homepageFunctions);
  function homepageFunctions(){
    if(!document.body.classList.contains('homepage')) return;
    const slideshowSpeed = 2000,
          slideshowClickSpeed = 4000,
          slideshowTransition = 400,
          fragment = document.createDocumentFragment(),
          header = document.getElementById('header'),
          gallery = document.createElement('div'),
          galleryImages = [...document.querySelectorAll('.gallery-wrapper img')],
          arrows = document.querySelectorAll('.index-gallery .arrow').forEach(arrow => {
            arrow.addEventListener('click', () => arrowClick(arrow))
          }), // arrow click function
          activeObserver = new MutationObserver(mutations => {
            const mutation = mutations[0],
                  video = mutation.target.querySelector('video');
            if(mutation.target.dataset.active > 0) video.play()
            else video.pause()
          });
    // remove existing gallery asap to not load unused images
    document.querySelector('.gallery-wrapper').remove()
    // move gallery from dom to fragment before we add slides to it
    fragment.appendChild(gallery)
    // prepare for updating slides and autoplay timer
    let windowWidth = window.innerWidth,
        windowHeight = window.innerHeight,
        headerHeight,
        activeSlide,
        nextSlide,
        prevSlide,
        powerSavingMode = detectPowerSavingMode().then((result) => {
          // once we've detected if the device is in low power mode...
          // create slide for each image, load image and append to custom gallery
          galleryImages.slice(0,10).map(image => createslideFunction(image, result));
          // call function to create the custom gallery
          customGallery()
          // defer loading of gallery images after the first 10 (script to defer is in header)
          Defer(loadMoreImages(result), 0);
        }),
        timer = {
          handle: 0,
          start: function(delay) {
            this.stop();
            this.handle = setTimeout(slideChange, delay);
          },
          stop: function() {
            if (this.handle) {
              clearTimeout(this.handle);
              this.handle = 0;
            }
          }
        };
    
    // RUN FUNCTIONS
    
    // update window and header height
    updateglobalsizesFunction()
    
    // trigger image resizing on window resize
    window.addEventListener('resize', debounce(function (e) {
      if (windowWidth !== window.innerWidth) {
        console.log('resized')
        updateglobalsizesFunction()
        galleryImages.map(image => imageLoader(image));
        windowWidth = window.innerWidth;
      }
    }));
    
    // FUNCTIONS TO RUN
    
    function detectPowerSavingMode() {
      if (/iP(hone|ad|od)/.test(navigator.userAgent)) {
        return new Promise((resolve) => {
          let fps = 50,
              numFrames = 30,
              startTime = performance.now(),
              i = 0,
              handle = setInterval(() => {
                if (i < numFrames) {
                  i++;
                  return;
                }
                clearInterval(handle);
                let interval = 1000 / fps,
                    actualInterval = (performance.now() - startTime) / numFrames,
                    ratio = actualInterval / interval;
                resolve(ratio > 1.3);
              }, 1000 / fps);
        });
      } else {
        return detectFrameRate().then((frameRate) => {
          if (frameRate < 31) return true;
          else if (navigator.getBattery) {
            return navigator.getBattery().then((battery) => {
              return (!battery.charging && battery.level <= 0.2) ? true : false;
            });
          }
          return undefined;
        });
      }
    }
    function detectFrameRate() {
      return new Promise((resolve) => {
        let numFrames = 30;
        let startTime = performance.now();
        let i = 0;
        let tick = () => {
          if (i < numFrames) {
            i++;
            requestAnimationFrame(tick);
            return;
          }
          let frameRate = numFrames / ((performance.now() - startTime) / 1000);
          resolve(frameRate);
        };
        requestAnimationFrame(() => tick() );
      });
    }
    
    function createslideFunction(image, lowPowerMode, deferred){
      const slide = document.createElement('div'),
            imageContainer = document.createElement('div'),
            title = document.createElement('p'),
            alt = image.alt,
            vidSrc = lowPowerMode ? false : image.dataset.src.split('.').slice(-2, -1)[0].endsWith('video') ? image.dataset.src.split('/').pop().replace(/.jpg|.png|.gif/gi,'') : false;
      //console.log(vidSrc)
      if(!deferred) gallery.appendChild(slide)
      else fragment.appendChild(slide)
      slide.appendChild(imageContainer)
      slide.appendChild(title)
      slide.setAttribute('data-active', 0)
      slide.classList.add('slide')
      title.textContent = alt;
      if(!vidSrc) {
        imageContainer.appendChild(image)
        const focalPoint = imageLoader(image).split(',').map(x => parseFloat(x) * 100 + '%');
        image.style.objectPosition = focalPoint[0] + focalPoint[1];
        return;
      } else {
        const video = document.createElement('video');
        video.src = '/s/' + vidSrc + '.mp4';
        video.muted = true;
        video.loop = true;
        video.setAttribute('playsinline', true);
        video.autoplay = true;
        video.poster = image.dataset.src + '?format=1000w';
        video.pause()
        video.style.objectPosition = imageLoader(image).split(',').map(x => parseFloat(x) * 100 + '%').join(' ');
        imageContainer.appendChild(video)
        activeObserver.observe(slide, {
          attributes: true,
          attributeFilter: ['data-active']
        });
        //video.addEventListener('playing', () => console.log("The video is now playing") )
        //video.addEventListener('pause', () => console.log("The video is now paused") )
        return;
      }
    }
    
    function loadMoreImages(lowPowerMode){
      console.log('deferred images now loading')
      galleryImages.slice(11).map(image => createslideFunction(image, lowPowerMode, true))
      gallery.appendChild(fragment)
    }
    
    // set-up new custom gallery and add to existing gallery container
    function customGallery(){
      gallery.classList.add('custom-gallery')
      gallery.firstElementChild.dataset.active = 1;
      document.querySelector('.index-gallery').appendChild(gallery)
      // start the autoplay timer
      timer.start(slideshowSpeed);
    }
    // slide change function
    function slideChange(){
      activeSlide = getActiveSlide();
      nextSlide = getNextSlide();
      nextSlide.children().first().fadeTo(slideshowTransition, 1, function(){
        activeSlide.children().first().fadeTo(slideshowTransition, 0)
      })
      activeSlide.attr('data-active', 0)
      nextSlide.attr('data-active', 1)
      timer.start(slideshowSpeed);
    }
    // get active slide
    function getActiveSlide(){
      return $('.custom-gallery').find('.slide[data-active="1"]')
    }
    // get next slide
    function getNextSlide(){
      return activeSlide.next().length > 0 ? activeSlide.next() : $('.custom-gallery > .slide:first-child')
    }
    // get previous slide
    function getPrevSlide(){
      return activeSlide.prev().length > 0 ? activeSlide.prev() : $('.custom-gallery > .slide:last-child')
    }
    // on arrow click stop timer, update active slide as previous or next slide, reset timer
    function arrowClick(arrow){
      timer.stop();
      activeSlide = getActiveSlide();
      if(arrow.classList.contains('previous-slide')){
        prevSlide = getPrevSlide();
        prevSlide.children().first().fadeTo(slideshowTransition, 1, function(){
          activeSlide.children().first().fadeTo(slideshowTransition, 0)
        })
        activeSlide.attr('data-active', 0)
        prevSlide.attr('data-active', 1)
      } else {
        slideChange()
      }
      timer.start(slideshowClickSpeed);
    }
    
    function updateglobalsizesFunction() {
      setTimeout(function(){
        windowHeight = window.innerHeight;
        headerHeight = header.getBoundingClientRect().height;
        document.documentElement.style.setProperty('--window-height', windowHeight + 'px');
        document.documentElement.style.setProperty('--header-height', headerHeight + 'px');
      },200);
    } // end get window and header heights function

    // helper function to load images
    function imageLoader(image, load) {
      setTimeout(function () {
        window.ImageLoader.load(image, {
          load: load ? load : true,
          mode: 'fill'
        });
      }, 100);
      return image.dataset.imageFocalPoint;
    }
    // helper function for resize debounce
    function debounce(func) {
      var timer;
      return function (event) {
        if (timer) clearTimeout(timer);
        timer = setTimeout(func, 500, event);
      };
    }
    
  } // end run homepage functions