$(document).ready( function() {
    var isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if( isMobile ) {
        $('#mobile-profile-img').show();
    }
});