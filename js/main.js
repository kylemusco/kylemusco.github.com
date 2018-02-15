var hackathon;
var hardware;
var roadtrips;
var astronomy;

$(document).ready( function() {
        setTimeout( function() {
            hackathon  = new freezeframe('#hackathon-gif').freeze();
            hardware = new freezeframe('#hardware-gif').freeze();
            roadtrip = new freezeframe('#roadtrip-gif').freeze();
            astronomy = new freezeframe('#astronomy-gif').freeze();
        }, 250 );
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

$(document).on('mouseover', '#astronomy', function() {
    astronomy.trigger();
});

$(document).on('mouseleave', '.interest-box', function() {
    hackathon.release();
    hardware.release();
    roadtrip.release();
    astronomy.release();
});