$(document).ready(function() {
    // Configuration
    const config = {
        apiUrl: './api/testimonials.php',
        testimonialsContainer: $('.testimonials-container'),
        testimonialForm: $('#testimonialForm'),
        loadingClass: 'loading',
        errorClass: 'error-message',
        successClass: 'success-message',
        currentSlide: 0
    };

    // Gestion des boutons de navigation du carrousel
    $(document).on('click', '.testimonial-prev', function() {
        const $testimonials = $('.testimonial:not(.testimonial-nav, .add-testimonial-btn)');
        let newIndex = (config.currentSlide - 1 + $testimonials.length) % $testimonials.length;
        showSlide(newIndex);
        startCarousel();
    });
    
    $(document).on('click', '.testimonial-next', function() {
        const $testimonials = $('.testimonial:not(.testimonial-nav, .add-testimonial-btn)');
        let newIndex = (config.currentSlide + 1) % $testimonials.length;
        showSlide(newIndex);
        startCarousel();
    });
    
    // Initialisation
    init();

    function init() {
        loadTestimonials();
        setupEventListeners();
        initRatingSystem();
    }

    function setupEventListeners() {
        config.testimonialForm.on('submit', handleFormSubmit);

        // Modal open/close handling
        $('#openTestimonialForm').on('click', function(e) {
            e.preventDefault();
            $('#testimonialModal').addClass('show');
            $('body').addClass('modal-open');
        });

        $('.close-modal').on('click', function() {
            $('#testimonialModal').removeClass('show');
            $('body').removeClass('modal-open');
        });

        // Close modal when clicking outside
        $(document).on('click', function(e) {
            if ($(e.target).hasClass('modal-overlay')) {
                $('#testimonialModal').removeClass('show');
                $('body').removeClass('modal-open');
            }
        });
    }

    function initRatingSystem() {
        const $stars = $('.rating-stars i');
        let selectedRating = 0;

        $stars.on('mouseover', function() {
            const rating = $(this).data('rating');
            highlightStars(rating);
        });

        $stars.on('mouseout', function() {
            highlightStars(selectedRating);
        });

        $stars.on('click', function() {
            selectedRating = $(this).data('rating');
            $('#rating').val(selectedRating);
            highlightStars(selectedRating);
        });

        function highlightStars(count) {
            $stars.removeClass('fas').addClass('far');
            $stars.slice(0, count).removeClass('far').addClass('fas');
        }

        // Reset selection
        $('.reset-rating').on('click', function(e) {
            e.preventDefault();
            selectedRating = 0;
            $('#rating').val('');
            $stars.removeClass('fas').addClass('far');
        });
    }

    function handleFormSubmit(e) {
        e.preventDefault();
        
        const $form = $(this);
        const $submitBtn = $form.find('button[type="submit"]');
        const originalBtnText = $submitBtn.html();
        
        // Disable submit button
        $submitBtn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Sending...');
        
        // Get form data
        const formData = {
            name: $('#name').val().trim(),
            email: $('#email').val().trim(),
            location: $('#location').val().trim(),
            rating: $('#rating').val() || 0,
            comment: $('#comment').val().trim()
        };

        // Form validation
        if (!validateForm(formData)) {
            $submitBtn.prop('disabled', false).html(originalBtnText);
            return;
        }

        // Send data to server
        $.ajax({
            url: config.apiUrl,
            type: 'POST',
            data: formData,
            dataType: 'json',
            success: function(response) {
                if (response.success) {
                    showSuccess('Your testimonial has been submitted successfully! It will be published after moderation.');
                    $form[0].reset();
                    loadTestimonials();
                } else {
                    showError(response.message || 'An error occurred while submitting the testimonial.');
                }
            },
            error: function() {
                showError('An error occurred while communicating with the server.');
            },
            complete: function() {
                $submitBtn.prop('disabled', false).html(originalBtnText);
            }
        });
    }

    function validateForm(formData) {
        if (!formData.name) {
            showError('Please enter your name.');
            return false;
        }

        if (!formData.email) {
            showError('Please enter your email address.');
            return false;
        }

        if (!isValidEmail(formData.email)) {
            showError('Please enter a valid email address.');
            return false;
        }

        if (!formData.comment) {
            showError('Please leave a comment.');
            return false;
        }

        if (formData.comment.length < 10) {
            showError('Your comment must be at least 10 characters long.');
            return false;
        }

        return true;
    }

    function loadTestimonials() {
        const $container = $('.testimonials-container');
        $container.addClass(config.loadingClass);
        
        $.ajax({
            url: config.apiUrl,
            type: 'GET',
            dataType: 'json',
            success: function(response) {
                console.log('API response:', response);
                if (response.success && response.data && response.data.length > 0) {
                    console.log('Number of testimonials received:', response.data.length);
                    renderTestimonials(response.data);
                } else {
                    console.log('No testimonials found in the response');
                    $container.prepend('<div class="no-testimonials">No testimonials yet. Be the first to leave a review!</div>');
                }
            },
            error: function() {
                showError('An error occurred while loading testimonials.');
            },
            complete: function() {
                $container.removeClass(config.loadingClass);
            }
        });
    }

    function renderTestimonials(testimonials) {
        const $container = $('.testimonials-container');
        $container.find('.testimonial:not(.testimonial-nav, .add-testimonial-btn)').remove();
        
        if (testimonials.length === 0) {
            $container.prepend('<div class="no-testimonials">Aucun témoignage pour le moment. Soyez le premier à laisser un avis !</div>');
            return;
        }
        
        // Create testimonial elements
        testimonials.forEach((testimonial, index) => {
            const activeClass = index === 0 ? 'active' : '';
            const stars = Array(5).fill('').map((_, i) => 
                `<i class="${i < testimonial.rating ? 'fas' : 'far'} fa-star"></i>`
            ).join('');
            
            const date = testimonial.created_at ? new Date(testimonial.created_at).toLocaleDateString('fr-FR') : '';
            
            const testimonialHtml = `
                <div class="testimonial ${activeClass}" data-index="${index}">
                    <div class="stars">
                        ${stars}
                    </div>
                    <p class="testimonial-text">"${escapeHtml(testimonial.comment)}"</p>
                    <div class="testimonial-meta">
                        <span class="testimonial-author">${escapeHtml(testimonial.name)}</span>
                        ${testimonial.location ? `<span class="testimonial-location">${escapeHtml(testimonial.location)}</span>` : ''}
                        ${date ? `<span class="testimonial-date">${date}</span>` : ''}
                    </div>
                </div>`;
                
            $container.prepend(testimonialHtml);
        });
        
        updateDots(testimonials.length);
        startCarousel();
    }
    
    function updateDots(count) {
        const $dotsContainer = $('.testimonial-dots');
        $dotsContainer.empty();
        
        for (let i = 0; i < count; i++) {
            const activeClass = i === 0 ? 'active' : '';
            $dotsContainer.append(`<span class="dot ${activeClass}" data-index="${i}"></span>`);
        }
        
        $('.dot').on('click', function() {
            const index = $(this).data('index');
            showSlide(index);
        });
    }
    
    function showSlide(index) {
        const $testimonials = $('.testimonial:not(.testimonial-nav, .add-testimonial-btn)');
        const $dots = $('.dot');
        
        if (index >= $testimonials.length) index = 0;
        if (index < 0) index = $testimonials.length - 1;
        
        $testimonials.removeClass('active');
        $testimonials.eq(index).addClass('active');
        
        $dots.removeClass('active');
        $dots.eq(index).addClass('active');
        
        config.currentSlide = index;
    }
    
    function startCarousel() {
        if (window.carouselInterval) {
            clearInterval(window.carouselInterval);
        }
        
        window.carouselInterval = setInterval(() => {
            showSlide((config.currentSlide + 1) % $('.testimonial:not(.testimonial-nav, .add-testimonial-btn)').length);
        }, 5000);
    }

    function showError(message) {
        const $errorDiv = $('<div class="' + config.errorClass + '">' + message + '</div>');
        $('body').append($errorDiv);
        
        setTimeout(() => {
            $errorDiv.fadeOut(300, function() {
                $(this).remove();
            });
        }, 5000);
    }

    function showSuccess(message) {
        const $successDiv = $('<div class="' + config.successClass + '">' + message + '</div>');
        $('body').append($successDiv);
        
        setTimeout(() => {
            $successDiv.fadeOut(300, function() {
                $(this).remove();
            });
        }, 5000);
    }

    function isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    function escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe
            .toString()
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
});