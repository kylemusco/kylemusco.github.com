$(document).ready( function() {
    // Display 'all' projects by default
    displayProjects("all");

    // Set height and width
    var width = $(window).width();
    var height = $(window).height();

    var isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if( !isMobile ) {
        $('#project-container').width( width - 400 );
        $('#project-container').height( height - 100 );
    }

});

// Displays project types
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

/* Display all projects */
$(document).on('click', '#all', function() {
    setInactive();
    displayProjects("all");

    $(this).addClass("active");
});

/* Display hackathon projects */
$(document).on('click', '#hackathons', function() {
    setInactive();
    displayProjects("hackathons");
    
    $(this).addClass("active");
});

/* Display hardware projects */
$(document).on('click', '#hardware', function() {
    setInactive();
    displayProjects("hardware");
    
    $(this).addClass("active");
});

/* Display networking projects */
$(document).on('click', '#networking', function() {
    setInactive();
    displayProjects("networking");
    
    $(this).addClass("active");
});

/* Display software projects */
$(document).on('click', '#software', function() {
    setInactive();
    displayProjects("software");
    
    $(this).addClass("active");
});


/* Select nav item (Main Nav Item) */
var selectedNavItem;
$(document).on('click', '.left-nav-item', function() {
    $('.subitem-selected').removeClass('subitem-selected');

    selectedNavItem = $(this);
    var id = $(this).attr('id');
    console.log( $('#' + id + "-subitems") );

    // If nav item has children, display first child 
    if( $('#' + id + "-subitems").hasClass('left-nav-subitems')) {

        // Give nav item selected class
        selectedNavItem.addClass('subitem-selected');

        id = $('#' + id + "-subitems").find('div').first().attr('id');
        selectedNavItem = $('#' + id);

    } else {

    }

    
    $('#' + id).addClass('subitem-selected');
    displayNavItemView( id );
    

    resetNavbar();
    resetSubNavs();

    
});

/* Select nav item (Sub Nav Item) */
$(document).on('click', '.left-nav-subitem', function() {
    selectedNavItem = $(this);
    displayNavItemView( $(this).attr('id') );
    $(this).addClass('subitem-selected');
    
    resetNavbar();
    resetSubNavs();

    // Set parent to visible
    //$(this).parent().addClass('visible');

    
});



/* Displays nav item's view */
function displayNavItemView(id) {
    $('.project-containing-div').hide();
    $('#' + id + "-container" ).show();
}

/* Close project view */
$(document).on('click', '.project-close-btn', function() {
    $(this).parent().remove();
});


/* Go back */
$(document).on('click', '.back-btn', function() {
    window.history.back();
});


function resetSubNavs() {
    $('.left-nav-subitem').removeClass('subitem-selected');

    selectedNavItem.addClass('subitem-selected');

    // Hide all other subnavs
    $('.left-nav-subitems').each( function() {
        var nubs = $(this).find('.subitem-selected');
        if( nubs.length == 0 ) {    
            $(this).height(0);
        }
    });
}

/* Display subitems on hover */
var subnavOpen = false;
$(document).on('mouseover', '.left-nav-item', function() {
    
    var id = $(this).attr('id');
    var subitems = $('#' + id + '-subitems');

    subnavOpen = true;
    resetNavbar();

    // If item has subitems, show them
    if( subitems.hasClass("left-nav-subitems") ) {

      // Count subitems
      var subitemCount = 0;
      subitems.find('.left-nav-subitem').each( function() {
        subitemCount++;
      });

      // Change height of main nav
      $(this).height(30);

      // Set item as selected
      $(this).addClass('subitem-selected');

      // Change height of subnav container

      subitems.height( subitemCount*30 );
    }
});

/* Hide subitems on hover out */
var subItemSelected = false;
$(document).on('mouseout', '.left-nav-item', function() {
    var id = $(this).attr('id');
    var subitems = $('#' + id + '-subitems');

    // Check if subitem is selected
    //console.log("\n\n");
    
    /*
    subitems.find('.left-nav-subitem').each( function() {
        isSubItemSelected($(this));
    });
*/
    //console.log(subItemSelected);

    // If item has subitems, hide them
    if( !subItemSelected ) {
        if( subitems.hasClass("left-nav-subitems") ) {

        if( !subnavOpen ) {
            // Change height
            $(this).height(50);

            subitems.height(0);
        }
        }
    }
});

function isSubItemSelected(el) {
    if( el.hasClass('subitem-selected') ) {
            subItemSelected = true;
    }
}

function resetNavbar() {
    // Hide all other subnavs
    $('.left-nav-subitems').each( function() {
        var nubs = $(this).find('.subitem-selected');
        if( nubs.length == 0 ) {    
            $(this).height(0);
        }
    });

    //$('.left-nav-subitem').removeClass("subitem-selected");
    

    // Hide all other subnavs
    $('.left-nav-item').each( function() {
        var nubs = $('#' + $(this).attr('id') + "-subitems" ).find('.subitem-selected');
        if( nubs.length == 0 ) {  
            $(this).height(50);

             // Remove selected class
            $(this).removeClass('subitem-selected');
        }
    });

    // Set selected as selected
    selectedNavItem.addClass('subitem-selected');
}



String.prototype.replaceAll = function(str1, str2, ignore) 
{
    return this.replace(new RegExp(str1.replace(/([\/\,\!\\\^\$\{\}\[\]\(\)\.\*\+\?\|\<\>\-\&])/g,"\\$&"),(ignore?"gi":"g")),(typeof(str2)=="string")?str2.replace(/\$/g,"$$$$"):str2);
} 