$(document).ready( function() {
    // Display 'all' projects by default
    displayProjects("all");


    // Set height and width
    var width = $(window).width();
    var height = $(window).height();

    if( !isMobile ) {
        $('#project-container').width( width - 400 );
        $('#project-container').height( height - 100 );
    }

});

function displayProjects(tag) {
    // First, hide all projects
    $('.project-box').hide();

    // Then show projects with desired tag
    $('.project-box').each( function() {
        var tags = $(this).attr('tags');
        if( tags != undefined ) {
            if( tags.includes(tag) ) {
                $(this).show();
            }
        }
    });
}

function setInactive() {
    $('.project-nav-item').removeClass("active");
}

$(document).on('click', '#all', function() {
    setInactive();
    displayProjects("all");

    $(this).addClass("active");
});

$(document).on('click', '#hackathons', function() {
    setInactive();
    displayProjects("hackathons");
    
    $(this).addClass("active");
});

$(document).on('click', '#hardware', function() {
    setInactive();
    displayProjects("hardware");
    
    $(this).addClass("active");
});

$(document).on('click', '#networking', function() {
    setInactive();
    displayProjects("networking");
    
    $(this).addClass("active");
});

$(document).on('click', '#software', function() {
    setInactive();
    displayProjects("software");
    
    $(this).addClass("active");
});