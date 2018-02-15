var hackathon;
var hardware;
var roadtrips;

$(document).ready( function() {
        setTimeout( function() {
            hackathon  = new freezeframe('#hackathon-gif').freeze();
            hardware = new freezeframe('#hardware-gif').freeze();
            roadtrip = new freezeframe('#roadtrip-gif').freeze();
        }, 250 );

        console.log("ready");
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