/**
* @author tohachan
* @since 12.09.2012
*
* Расширяет jQuery свойствами с названием платформ
*
* Например: $.ipad вернет true если скрипт запустить на ipad
*/
(function($, window) {

	var platforms = [
		'linux',
		'mac',
		'win',
		'solaris',
		'unix',
		'ipad',
		'iphone',
		'ipad'
	];

	for (var i = 0; i < platforms.length; i++) {
		$[platforms[i]] = navigator && navigator.platform && navigator.platform.toLowerCase().indexOf( platforms[i] ) !== -1;
	}

}) (jQuery, window);

/**
* Функция, которая производит проверку на определенный-браузер/ОС и т.п.
* Если нужна какая-то новая проверка - дописываем новый case и передаем его имя в check.
* @since 12.08.12 13:19
* @author a.gugiev
*
* @return boolean Если проверка прошла успешно - true. Если же браузер/ОС у пользователя отличается, или такой проверки нету - false.
*/
function browserIs(check) {
//TODO: добавить определение других браузеров и ОС

	switch (check) {
		case 'ie':
			return navigator.userAgent.indexOf('MSIE') != -1;
		case 'safari':
			return navigator.userAgent.indexOf('Safari') > -1  && navigator.userAgent.indexOf('Chrome') == -1;
		case 'chrome':
			return navigator.userAgent.indexOf('Chrome') != -1;
		case 'firefox':
			return navigator.userAgent.indexOf('Firefox') != -1;
		case 'webkit':
			return navigator.userAgent.indexOf('WebKit') != -1;
		case 'opera':
			return navigator.userAgent.indexOf('Opera') != -1;
		case 'apple-mobile':
			return navigator.userAgent.match(/iPad|iPhone|iPod/i) != null;
		default:
		return false;
	}
}


/**
* Create jQuery plugin from class
* @param {function} Class
*/
function createjQueryPlugin(Class, name) {

	var className = Class.toString().match(/^function ([^(]+)/)[1],
		pluginName = className.slice(0,1).toLowerCase() + className.slice(1),
		dataName = name || pluginName,
		$ = jQuery;

	$.fn[pluginName] = function(options) {
		var args;
		args = Array.prototype.slice.call(arguments, 1);

		return this.each(function() {
			var obj;

			obj = $(this).data( dataName );

			if (!(obj instanceof Class)) {
				obj = new Class( $(this), options );
				$(this).data(dataName, obj);
			}

			if ( obj[options] !== undefined ) {
				return obj[options].apply(obj, args);
			}

			return obj;
		});
	}
}


(function(window, $) {
	/*
	# Класс диалоговой фоторамы
	# @class
	*/

	var PhotoViewer;
	PhotoViewer = (function() {

		/*
		# @param {jQuery} $node jQuery объект
		# @constructor
		*/
		function PhotoViewer($node, options) {
			var self;
			self = this;
			this.options = $.extend(true, {
				type: 'image',
				selectors: {
					link: '.gallery__link',
					image: '.gallery__preview-image',
					viewer: '.viewer',
					viewerInner: '.viewer__inner',
					viewerImage: '.viewer__image',
					viewerTitle: '.viewer__title'
				}
			}, options);

			if (!$node && !$node.size()) {
				console.error('incorrect $node in PhotoViewer.constructor');
				return;
			}

			this.$gallery = $node;
			this._createImagesUrls();
			this._preloadImages();
			this._createModal();
			self.currentImage = 0;

			this.$gallery.on('click', self.options.selectors.image, function(event) {
				event.preventDefault();
				if (self.options.type === 'video') {
					self.showFrame(event);
				} else {
					self.show(event);
				}
			});

			$(document).on('keyup', function(event) {
				if (event.keyCode === 27) {
					self.$modal.fadeOut('fast', function() {
						if (self.options.type === 'video') {
							self.$container.html('');
						}
					});
				}
			});
		}


		PhotoViewer.prototype.slide = function(event) {
			var self = this;

			if (event.target.nodeName.toLowerCase() === 'img') {
				self.currentImage++;
				if (self.currentImage === self.fullImagesUrls.length) {
					self.currentImage = 0;
				}
				self.appendImage(self.currentImage);
			} else {
				self.$modal.fadeOut('fast');
			}
		}


		PhotoViewer.prototype.setCurrentImage = function(event) {
			var 
				src,
				self = this;

			src = $(event.target).closest(self.options.selectors.link).attr('href');

			for (var i = 0; i < self.fullImagesUrls.length; i++) {
				self.currentImage = i;
				
				if (self.fullImagesUrls[i].link === src) {
					break;
				} 
			}
		}


		PhotoViewer.prototype.show = function(event) {
			var self = this;

			self.setCurrentImage(event);
			self.appendImage(self.currentImage);
			self.showModal();
		}


		PhotoViewer.prototype.showFrame = function(event) {
			var
				src,
				$iframe,
				width,
				height,
				self = this;

			width = 0.9 * $(window).width();
			height = 0.9 * $(window).height();

			src = $(event.target).closest(self.options.selectors.link).attr('href');
			$iframe = $('<iframe/>');
			$iframe.attr({
				'src': src,
				width: width,
				height: height,
				frameborder: 0,
				allowfullscreen: true
			});

			self.$container.html($iframe);
			self.$modal.fadeIn('fast');

			// self.setCurrentImage(event);
			// self.appendImage(self.currentImage);
			// self.showModal();
		}


		PhotoViewer.prototype._createImagesUrls = function() {
			var self = this;
			
			self.fullImagesUrls = self.$gallery.data('images');
			if (!self.fullImagesUrls) {
				self.fullImagesUrls = [];
				self.$gallery.find(self.options.selectors.link).each(function() {
					self.fullImagesUrls.push({
						link: $(this).attr('href')
					});
				});
			}

		}


		PhotoViewer.prototype._preloadImages = function() {
			var self = this;
			
			$(window).load(function() {
				$(self.fullImagesUrls).each(function() {
       				$('<img/>')[0].src = this.link;
    			});
			});			
		}

		PhotoViewer.prototype._createModal = function() {
			var 
				$body,
				$modal,
				modalTemplate,
				self;
	
			self = this;
			$body = $(document.body);
			modalTemplate = $('#photo-viewer').html();
			$body.append(modalTemplate);

			self.$modal = $(self.options.selectors.viewer, $body);
			self.$container = $(self.options.selectors.viewerInner, self.$modal);

			if (self.options.type === 'video') {
				self.$modal.on('click', function(event) {
					if (event.target.nodeName.toLowerCase() === 'iframe') {

					} else {
						self.$modal.fadeOut('fast', function() {
							self.$container.html('');
						});
					}
				});
			} else {
				/* bind events */
				self.$modal.on('click', function(event) {
					self.slide(event);
				});
			}
		};

		PhotoViewer.prototype.showModal = function() {
			var self;
	
			self = this;
			self.$modal.fadeIn('fast');
		};

		PhotoViewer.prototype.appendImage = function(imageNumber) {
			var 
				title,
				$currentImage,
				self;
	
			self = this;
			$currentImage = $(self.options.selectors.viewerImage, self.$container)
				.attr('src', self.fullImagesUrls[imageNumber].link);
			
			title = self.fullImagesUrls[imageNumber].title;
			if (title) {
				$currentTitle = $(self.options.selectors.viewerTitle, self.$container)
					.text(title.text);
			}
		};

		return PhotoViewer;

	}) ();

	/*
	# Класс Меню
	# @class
	*/

	var NewMenu;
	NewMenu = (function() {

		/*
		# @param {jQuery} $node jQuery объект
		# @constructor
		*/
		function NewMenu($node, options) {
			var self;
			self = this;
			this.options = $.extend(true, {
				selectors: {
					content: '.main-wrapper',
					closeButton: '.menu .menu__close'
				},
				duration: 200,
				leftWidth: '-260px',
				easingFunction: 'easeOutQuint' 
			}, options);

			if (!$node && !$node.size()) {
				console.error('incorrect $node in NewMenu.constructor');
				return;
			}

			this.$menuButton = $node;
			this.$closeButton = $(this.options.selectors.closeButton);
			this.$content = $(this.options.selectors.content);
			this.contentVisible = false;

			this.$menuButton.on('click', function(event) {
				event.preventDefault();
				self.toggleMenu();				
			});
			this.$closeButton.on('click', function(event) {
				event.preventDefault();
				self.toggleMenu();				
			});

		}


		NewMenu.prototype.toggleMenu = function() {
			var self = this,
				left = 0;

			if (self.contentVisible) {
				left = 0;
				self.contentVisible = false;
				self.options.easingFunction = 'easeInCubic';
			} else {
				left = self.options.leftWidth;
				self.contentVisible = true;
				self.options.easingFunction = 'easeOutCubic';
			}

			this.$content.animate({
					left: left
				},
				self.options.duration,
				self.options.easingFunction
			);
		};

		return NewMenu;

	}) ();
	
	/*
	# Класс Instagram
	# @class
	*/

	var InstagramPhotos;
	InstagramPhotos = (function() {

		/*
		# @param {jQuery} $node jQuery объект
		# @constructor
		*/
		function InstagramPhotos($node, options) {
			var self;
			self = this;
			this.options = $.extend(true, {
				selectors: {
					container: '#sidebar'
				},
				accessToken : '421631593.ab103e5.e1859e7717714677813f5e926fd913a8',
				userID : '38092406'
			}, options);

			if (!$node && !$node.size()) {
				console.error('incorrect $node in InstagramPhotos.constructor');
				return;
			}

			this.$container = $node;
			self.fetchPhotos();
		}


		InstagramPhotos.prototype.fetchPhotos = function() {

			var
				param,
				access_token,
				cmdURL,
				self;
	
			self = this;
			access_token = self.options.accessToken;
			param = {
				access_token: access_token
			};
			cmdURL = 'https://api.instagram.com/v1/users/' + self.options.userID + '/media/recent/?callback=?';

		   	$.getJSON(cmdURL, param, function(data){
				self.onPhotoLoaded(data);
			});
		};

		InstagramPhotos.prototype.appendPhoto = function(photo) {
			
			var 
				self,
				$image,
				$title,
				$header,
				$content,
				$widget;

			self = this;

			$image = $('<img class="instagram-widget__photo"/>').attr('src', photo.preview);
			$link = $('<a class="instagram-widget__link">').attr('href', photo.link);

			if (photo.title) {
				$title = $('<span class="instagram-widget__title">').text(photo.title.text);
			} else {
				$title = $('<span>'); 				
			}

			$content = $('<div class="instagram-widget"></div>').data('images', photo.photos);
			
			$link.append($image);
			$content.append($link).append($title);

			self.$container.html($content);

			$content.photoViewer({
				selectors: {
					link: 'a',
					image: 'img'
				}
			});

		}

		InstagramPhotos.prototype.onPhotoLoaded = function(data) {
			
			var 
				data,
				photos,
				photo,
				self;

			self = this;
			photos = [];

		    if (data.meta.code == 200) {
		        
		        data = data.data;
		        
		        if (data.length > 0) {
		            for (var key in data) {

						photo = data[key];

		            	photos.push({
		            		link: photo.images.standard_resolution.url,
		            		preview: photo.images.low_resolution.url,
		            		title: photo.caption,
		            		location: photo.location
		            	});
		            }
		        }

		        photo = photos[0];
		        photo.photos = photos;
				self.appendPhoto(photo);
		    }
		}


		return InstagramPhotos;

	}) ();
	
	createjQueryPlugin(PhotoViewer);
	createjQueryPlugin(NewMenu);
	createjQueryPlugin(InstagramPhotos);

})(window, jQuery);


/*********************************************************************************/
/* вызов */
/*********************************************************************************/
jQuery(document).ready(function( $ ) { 

		$('.js-gallery').photoViewer({
			selectors: {
				link: 'a',
				image: 'img'
			}
		});
		$('.js-video-gallery').photoViewer({
			type: 'video',
			selectors: {
				link: 'a',
				image: 'img'
			}
		});

		$('.navigation-trigger').newMenu();

		$('#sidebar .textwidget').instagramPhotos();

		var setSliderHeight = function () {
			var $slider = $('#header-slider .slides'),
				windowWidth = $(window).width();
			
			if ( $slider.hasClass('slider-small') ) {
				windowWidth = $('.container > .content').width();
			}
			
			$slider.css({
				minHeight: 0.45 * windowWidth
			});
		};
		setSliderHeight();		


		//Drop Down Menu
		function mainmenu() {
		$('#nav ul').css({
			display: 'none'
		}); // Opera Fix
		
		$('#nav li').hover(function() {
			$(this).find('ul:first')
				.css({
					visibility: 'visible',
					display: 'none'
				}).fadeToggle(200);
			}, function() {
				$(this)
					.find('ul:first')
					.css({
						visibility: 'hidden'
					});
			});
		}
		
		mainmenu();
		
		
		//Add Menu Items
		$('#nav .entypo a').wrap('<div class="entypo-inner" />');	

		//Wrap blog items
		var divs = $(".home-blog li");
		
		for(var i = 0; i < divs.length; i += 4) {
		  divs.slice(i, i + 4).wrapAll("<li class='slide-portfolio'></li>");
		}		
		
		//Flexslider
		$(window)
			.load(function() {
				$('#header-slider').flexslider({
					slideshow: true,
					animationDuration: 200 
				});
				
				$('.flexslider').flexslider({
					slideshow: true,
					animationDuration: 200 
				});
			})
			.resize(function() {
				setSliderHeight();
			})
		
		
		// Tab Box
		$("ul.tabs").tabs("div.panes > div",{effect: "fade" }); 
		
		$('.hidden-toggle').click(function() {
		  $('.header-hidden').slideToggle('fast', function() {
		    // Animation complete.
		  });
		  $(".header-hidden-toggle-wrap").toggleClass("show-hidden");
		});
		
		
		// Show the goddamn sidebar
		$('#sidebar-close').click(function () {
		    $("#sidebar-wrap").addClass("show-sidebar");
		    $(".content,.header,.page-title,.footer,.footer-widgets").addClass("content-fade");
		});
		
		//Hide the goddamn sidebar
		$('#sidebar-close2').click(function () {
		    $("#sidebar-wrap").removeClass("show-sidebar");
		    $(".content,.header,.page-title,.footer,.footer-widgets").removeClass("content-fade");
		});

		
		//FitVids
		$(".okvideo").fitVids();
		
		
		//Menu
		$('#nav').mobileMenu({
			defaultText: 'Выберите раздел'			
		});
		
		
		//Responsive Select Menu		
	    if (!J.browser.opera) {
	        $('select.select-menu').each(function(){
	            var title = $(this).attr('title');
	            if( $('option:selected', this).val() != ''  ) title = $('option:selected',this).text();
	            $(this)
	                .css({'z-index':10,'opacity':0,'-khtml-appearance':'none'})
	                .after('<span class="select">' + title + '</span>')
	                .change(function(){
	                    val = $('option:selected',this).text();
	                    $(this).next().text(val);
	                    })
	        });
	    };
		
		
		//Toggle
		$('.showcase-toggle').click(function() {
		  $(".showcase,#header-slider").toggleClass("showcase-open");
		  $(".showcase-image").toggleClass("showcase-image-hide");
		  $(".showcase-info").toggleClass("showcase-info-open");
		  $(".showcase-title h2").toggleClass("showcase-title-white");
		  $(".showcase-text").toggleClass("showcase-text-show");
		  return false;
		});
		
		
		//Flickr Fancybox		
		$(".fancybox").fancybox({
			"transitionIn":			"elastic",
			"transitionOut":		"elastic",
			"easingIn":			"easeOutBack",
			"easingOut":			"easeInBack",
			"titlePosition":		"over",
			"padding":			0,
			"hideOnContentClick":		"true"
		});
		
			
		$(".social-widget").each(function(index) {
		    $(this).delay(400*index).fadeIn(200);
		});

		$(".b-video-container a").each( function (element, index) {
			var href = this.href,
				title = this.title;

			if ( href.indexOf('youtube') !== -1 ) {
				$(this).on( 'click', function( event ) {
					event.preventDefault();

					$.fancybox({
						'padding' : 0,
						'autoScale' : true,
						'title' : title,
						'overlayOpacity' : '.6',
						'overlayColor' : '#333',
						'transitionIn' : 'none',
						'transitionOut' : 'none',
						'centerOnScroll' : false,
						'showCloseButton' : true,
						'hideOnOverlayClick': false,
						'href' : href.replace(new RegExp("watch\\?v=", "i"), 'v/'),
						'type' : 'swf',
						'swf' : {
							'wmode': 'transparent',
							'allowfullscreen': 'true'
						}
					});
				} );
			} else {
				$(this).attr( 'target', '_blank' );
			}
		} );
});
