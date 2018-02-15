var hackathon;
var hardware;
var roadtrips;

$(document).ready( function() {
    var isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if( isMobile ) {
        $(window).on('popstate', function() {
            location.reload(true);
        });

        setTimeout( function() {
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
                '<a href="#!"><div class="mobile-menu-item" style="margin-top: 50%">About</div></a>' +
                '<a href="#!experience"><div class="mobile-menu-item">Experience</div></a>' +
                '<a href="#!projects"><div class="mobile-menu-item">Projects</div></a>' +
                '<a href="#!resume"><div class="mobile-menu-item">Resume</div></a>' +
                '<a href="#!contact"><div class="mobile-menu-item">Contact</div></a>' +
            '</div>');

            $('#spanContainer').css('transform', 'scale(2,2)');

            setTitle();

        }, 50 );
        
    } else {
        setTimeout( function() {
            hackathon  = new freezeframe('#hackathon-gif').freeze();
            hardware = new freezeframe('#hardware-gif').freeze();
            roadtrip = new freezeframe('#roadtrip-gif').freeze();
        }, 50 );
    }
});



/* Add title to mobile nav */
function setTitle() {
    $('#mobile-title').text( $('.view-title').text() );
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


$(document).on('mouseover', '#hackathon', function() {
    hackathon.trigger();
});

$(document).on('mouseover', '#hardware', function() {
    hardware.trigger();
});

$(document).on('mouseover', '#roadtrip', function() {
    roadtrip.trigger();
});

$(document).on('mouseleave', '.interest-box', function() {
    hackathon.release();
    hardware.release();
    roadtrip.release();
});