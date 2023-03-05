var selected = false;
$(document).on('click', '.x-container', function() {
    


    // 3 lines to X
    if( !selected) {
        
        // First line
        $('.start-position').eq(0).addClass('rotate-down');
        $('.start-position').eq(0).removeClass('start-position');

        // Second line
        $('.start-position').eq(0).css('border-bottom','3px solid transparent');

        // Third line
        $('.start-position').eq(1).addClass('rotate-up');
        $('.start-position').eq(1).removeClass('start-position');

        // Delay margins to avoid shift bug on animation
        $('.rotate-down').delay(1000).css('margin-left','1px');
        $('.rotate-up').delay(1000).css('margin-left','-3px');
        

    // X to 3 lines
    } else {

        // First line
        $('.rotate-down').addClass('start-position');
        $('.rotate-down').removeClass('rotate-down');

        // Second line
        $('.start-position').css('border-bottom','3px solid black');

        // Third line
        $('.rotate-up').addClass('start-position');
        $('.rotate-up').removeClass('rotate-up');

        $('.start-position').delay(500).css('margin-left','5px');

    }

    selected = !selected;
});