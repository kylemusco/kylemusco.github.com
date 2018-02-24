
$(document).ready( function() {
    var isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if( isMobile && $(window).width() < 1300 ) {
        $(window).on('popstate', function() {
            location.reload(true);
        });

        setTimeout( function() {
            // Append mobile nav
            $('#content').prepend('<div class="mobile-nav">' +
                '<div id="mobile-title" class="mobile-title"></div>' +
                '<div class="nav-button-container">' +
                    '<div class="spanContainer" id="spanContainer">' +
                        '<div id="firstNavbarLine" class="divsForNavBar"></div>' +
                        '<div id="secondNavbarLine" class="divsForNavBar"></div>' +
                        '<div id="fourthNavbarLine" class="divsForNavBarHiddenOne"></div>' +
                        '<div id="thirdNavbarLine" class="divsForNavBar"></div>' +
                    '</div>' +     
                '</div>' +       
            '</div>' +
            '<div class="mobile-menu">' +
                '<a href="index.html"><div class="mobile-menu-item" style="margin-top: 50%">About</div></a>' +
                '<a href="experience.html"><div class="mobile-menu-item">Experience</div></a>' +
                '<a href="projects.html"><div class="mobile-menu-item">Projects</div></a>' +
                '<a href="img/Kyle Musco - Resume.pdf"><div class="mobile-menu-item">Resume</div></a>' +
            '</div>');

            // Resize menu button
            $('#spanContainer').css('transform', 'scale(2,2)');

            setTitle();

        }, 50 );
        
    } else {
        $('.derp-block').remove();
    }
});

/* Add title to mobile nav */
function setTitle() {
    //$('#mobile-title').text( $('.view-title').text() );
    $('.view-title').text('');
}

var toggled = false;
$(document).on('click', '#spanContainer', function() {
    if( !toggled ) {
        $('#firstNavbarLine').css('border','solid 2px transparent');
        $('#secondNavbarLine').css( 'transform', 'rotate(45deg)' );
        $('#thirdNavbarLine').css('border','solid 2px transparent');
        $('#fourthNavbarLine').css( 'transform', 'rotate(-45deg)' );
    } else {
        $('#firstNavbarLine').css('border','solid 2px white');
        $('#secondNavbarLine').css( 'transform', 'rotate(0deg)' );
        $('#thirdNavbarLine').css('border','solid 2px white');
        $('#fourthNavbarLine').css( 'transform', 'rotate(0deg)' );
    }

    toggled = !toggled;

    $('.mobile-menu').toggle();
});

$(document).on('click', '.mobile-menu', function() {
    $('#firstNavbarLine').css('border','solid 2px white');
    $('#secondNavbarLine').css( 'transform', 'rotate(0deg)' );
    $('#thirdNavbarLine').css('border','solid 2px white');
    $('#fourthNavbarLine').css( 'transform', 'rotate(0deg)' );

    toggled = !toggled;

    $(this).toggle();
});



