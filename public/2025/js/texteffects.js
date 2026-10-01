$(document).ready( function() {

    // Find each div with 'effect' attribute and convert each character to a div
    $('div[effect]').each( function() {
        var effect = $(this).attr('effect');
        var text = $(this).text();

        // Get duration from div attributes      
        var duration = $(this).attr('duration');
        if( duration == undefined ) {
            duration = 1000;
        }

        // Take style from parent element to be appended to <span> elements
        var style = $(this).attr('style');

        // Clear div
        $(this).empty();

        // Iterate through each character and create a <span>
        var targetArr = []; // TargetArr is used for choosing characters randomly

        // Animation for space text
        if( effect == 'space' ) {
            for( var i=0; i<text.length; i++ ) {
                var newChar = text[i];
                $(this).append('<span class="space" style="' + style + '">' + newChar.replace(' ', '&nbsp;') + "</span>");

                if( newChar != ' ')
                    targetArr.push(i+1);
            }

            // Iterate through targetArr 
            for( i=0; i<text.length; i++ ) {
                // First get target randomly from targetArr
                var target = targetArr[Math.floor(Math.random()*targetArr.length+1)-1];

                // Create new timeline object
                var timeline = anime.timeline({loop: false});
                var delay = Math.floor(Math.random()*500) + 20;

                // If even, move up
                if( target % 2 == 0 ) {
                    timeline.add({
                        targets: '.space:nth-child(' + target+ ')',
                        opacity: 1,
                        easing: 'easeInQuad',
                        translateY: ["1em", 0],
                        duration: duration,
                        delay: delay
                    });
                // If odd, move down    
                } else {
                    timeline.add({
                        targets: '.space:nth-child(' + target + ')',
                        opacity: 1,
                        easing: 'easeInQuad',
                        translateY: ["-1em", 0],
                        duration: duration,
                        delay: delay
                    });
                }

                // Remove element from targetArr
                targetArr.splice(targetArr.indexOf(target),1);
            }
        }
    });
});

