/* Custom Javascript */
var isMobile;
var selectedView;
$(document).ready( function() {

    isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    // Display nav after delay
    setTimeout( function() {
        $('#nav-container').fadeIn(3000);
    }, 500 );
    
    // Check for URL params
    route( getUrlParameter('view') );

    if( isMobile ) {
        mobileHome();
    }
});

function mobileHome() {
    // Fix title font size
    $('.title').find('div').each( function(i) {
        $(this).find('span').each( function() {
            $(this).css('font-size', '80px');
            $(this).css('margin-top', '50px');
        });
    });

    $('.subtitle').find('div').each( function(i) {
        $(this).css('margin-top','80px');

        $(this).find('span').each( function() {
            $(this).css('font-size', '25px');
        });
    });

    // Update side nav
    // $('#nav-container').remove();
    $('#nav-container').css('height', '800px')
    $('#nav-container').css('font-size', '40px')

    // Add mobile nav
    // $('body').append('<div id="mobile-nav-container" class="mobile-nav-container"><div id="mobile-nav-btn" class="mobile-nav-btn"><div></div><div></div><div></div></div></div>');
}

/* Display nav bar */
var isNavOpen = false;
$(document).on('click', '#mobile-nav-btn', function() {
    if( !isNavOpen ) {

        // Clear nav-btn
        $('#mobile-nav-btn').empty();

        // Transform button into "Experience" icon
        $(this).animate({
               width: '180px',
               height: '180px',
               bottom: '67px',
               opacity: '1'
        }, 100 );

        // Add Icon and text
        $(this).addClass('close');
        $(this).append('<img src="images/icons/experience.png" class="experience-icon"><div class="nav-description" style="margin-left: 15px; margin-top: 55px; border:none;">EXPERIENCE</div>');

        // Add nav items
        setTimeout( function() {
            var navItems = '<div id="projects-nav" class="mobile-nav-item-container close"><div class="mobile-nav-item"><img src="images/icons/projects.png" class="projects-icon"></div><div class="nav-description">PROJECTS</div></div>' +
            '<div id="resume-nav" class="mobile-nav-item-container close"><div class="mobile-nav-item"><img src="images/icons/resume.png" class="resume-icon"></div><div class="nav-description">RESUME</div></div>' +
            '<div id="contact-nav" class="mobile-nav-item-container close"><div class="mobile-nav-item"><img src="images/icons/contact.png" class="contact-icon"></div><div class="nav-description">CONTACT</div></div>' +
            '<div id="close-nav-btn" class="mobile-nav-item-small close"><img src="images/icons/arrow.png" class="arrow-icon"></div>';

            $('#mobile-nav-container').append(navItems);

            // Slide out buttons
            var width = $(window).width();
            var slide = 0;
            $('.mobile-nav-item-container').each( function(i) {
                slide = 240 + 200 * i;
                $(this).animate({
                    left: slide
                });
            });
            slide+=200;
            $('.mobile-nav-item-small').animate({
                left: slide
            });

        }, 50 );
            
        isNavOpen = !isNavOpen;
    } 
});

/* Close nav bar */
$(document).on('click', '.close', function() {
    if( isNavOpen ) {
        // If experience button is pressed, display experience
        if( $(this).attr('id') == 'mobile-nav-btn') {
            displayExperience();
        }

        // Hide text
        $('.nav-description').fadeOut('fast');

        // Slide divs back to main nav button
        $('.mobile-nav-item-container').each( function(i) {
                $(this).animate({
                    left: '40px'
                }, 200 ).fadeOut(20);
        });

        // Slide tiny button back to main nav button
        $('.mobile-nav-item-small').animate({
                left: '40px'
        }, 200 ).fadeOut(20);

        // Wait, then change main button back to normal
        $('#mobile-nav-btn').delay(85).animate({
               width: '120px',
               height: '120px',
               opacity: '1'
        });

        $('#mobile-nav-btn').removeClass('close');

        // Wait, then reset navbar back to normal
        setTimeout( function() {
            $('.mobile-nav-item-container').remove();
            $('.mobile-nav-item-small').remove();
            $('#mobile-nav-btn').empty();
            $('#mobile-nav-btn').append("<div></div><div></div><div></div>");
        }, 250 );

        isNavOpen = !isNavOpen;
    }
});

/* Handle nav click */
$(document).on('click', '.nav-container li', function() {
    // Remove 'selected' class
    $('.nav-container li').removeClass('selected');

    // End timelineInterval interval
    clearInterval(timelineInterval);

    // Clear 'Content' container 
    $('#content').empty();

    // Add 'selected' class
    $(this).addClass('selected');

    switch($(this).attr('id') ) {
        case 'experience':
            drawExperience();
            break;
        case 'projects':
        case 'resume':
        case 'contact':
            clearURLParams();
            break;
        default:
            break;
    }
});

function displayExperience() {
    // Set selected View
    selectedView = 'experience';

    // Clear title
    $('.title').empty();
    $('.title').html('<div class="mobile-title">EXPERIENCE</div>');

    // Clear content
    $('#content').empty();

    $('#content').append('<div id="experience-content" class="experience-container"></div>' );

    // Add companies
    Object.keys(experience).forEach( function(key) {
        $('#experience-content').append('<div class="experience-item" key="' + key +'"><div class="experience-top"><img src=' + experience[key].mobilelogo + ' class="experience-item-logo"><div class="experience-period">' + experience[key].subtitle + '</div></div><div class="experience-item-description">' + experience[key].description + '</div></div>');
    });
}

// Display Experience's projects
$(document).on('click','.experience-item', function() {
    selected = $(this).attr('key');

    // Replace title with company
    $('.title').empty();
    $('.title').append('<img src="' + experience[selected].logo + '" class="experience-desc-title">');

    // Clear experience list
    $('#experience-content').empty();

    // Add projects to galaxy
    setTimeout( function() {
        addProjects = setInterval( addProject, 500 );
    }, 100 );

    // Add 'Back' button
});



function displayProjects() {
    selectedView = 'projects';

    // Clear title
    $('.title').empty();
    $('.title').html('<div class="mobile-title">PROJECTS</div>');

    // Clear content
    $('#content').empty();
}

$(document).on('click','#projects-nav', function() {
    displayProjects();
});

function displayResume() {
    selectedView = 'resume';
    window.location.href = "Resume.pdf";
}

$(document).on('click','#resume-nav', function() {
    displayResume();
});

function displayContact() {
    selectedView = 'contact';

    // Clear title
    $('.title').empty();
    $('.title').html('<div class="mobile-title">CONTACT</div>');

    // Clear content
    $('#content').empty();
}

$(document).on('click','#contact-nav', function() {
    displayContact();
});



function clearURLParams() {
    var url = document.location.href;
    var split = url.split("?");
    history.pushState({}, null, split[0]);
}

/* Function to update URL parameters ( Used for navigation ) */
function updateURLparams(view) {
    var url = document.location.href;
    if( document.location.href.indexOf('view') > -1 ) {
        if( getUrlParameter('view') == view ) {
            return;
        }

        // Else remove view parameter
        url = url.replace(/&?view=([^&]$|[^&]*)/i, "");
    }

    if( document.location.href.indexOf('?') > -1 ) {
        url += "&view=" + view;
    }else{
        url += "?view=" + view;
    }

    history.pushState({}, null, url);
}

/* Gets URL parameter */
function getUrlParameter(sParam) {
    var sPageURL = decodeURIComponent(window.location.search.substring(1)),
        sURLVariables = sPageURL.split('&'),
        sParameterName,
        i;

    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');

        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? true : sParameterName[1];
        }
    }
};

/* Used to redirect user based on URL params */
function route(url) {
    if( url == undefined ) 
        return;
    var splitUrl = url.split('/');

    if( splitUrl[0] == 'experience' ) {
        $('#experience').addClass('selected');
        
        selected = splitUrl[1].replace("%20", " ");
        drawExperience();
        
        setNavSelection();
    }
}

/* Draw Experience View */
var selected;
var timelineInterval;
function drawExperience() {

    // Fixes glitch where hovering over icons too quickly removes them completely
    timelineInterval = setInterval( function() {
        $('.icon-container').each( function() {
            if( $(this).find('.company-icon').css('opacity') == 0 && $(this).find('.company-icon-white').css('display') == 'none' ) {
                $(this).find('.company-icon-white').css('display','block');
            }
        });
    }, 100 );

    var html = '<div class="experience-timeline left-nav"><div class="experience-header">PRESENT</div>';

    // Create timeline
    html += '<div class="experience-company-list"><div class="timeline-line"></div>';
    var count = 0;
    Object.keys(experience).forEach( function(key) {
        // Set first company as selected by default
        if( count == 0 ) {
            html += '<div class="icon-container" key="' + key + '"><img class="company-icon-white" src="' + experience[key].iconwhite + '"><img class="company-icon" style="opacity:1;" src="' + experience[key].icon + '">';

            if( key.length > 10 ) {
                html += '<div class="timeline-company-name-double" style="color:white;">' + key + '</div>';
            } else {
                html += '<div class="timeline-company-name-single" style="color:white;">' + key + '</div>';
            }

            if( selected == undefined ) {
                selected = key;
            }
        } else {
            html += '<div class="icon-container" key="' + key + '"><img class="company-icon-white" src="' + experience[key].iconwhite + '"><img class="company-icon" src="' + experience[key].icon + '">';

            if( key.length > 10 ) {
                html += '<div class="timeline-company-name-double">' + key + '</div>';
            } else {
                html += '<div class="timeline-company-name-single">' + key + '</div>';
            }
        }
        html += '</div>';
        count++;
    });
    html += '</div><div class="experience-header">PAST</div></div>';

    // Add content div
    html += '<div id="experience-content" class="experience-content-container"></div>';

    $('#content').append(html);

    $('.experience-timeline').fadeIn(1000);
    

    drawSelectedCompany();
}

/* Draws company's content when clicked */
var addProjects;
function drawSelectedCompany() {
    // Clear experience-content div
    $('#experience-content').empty();
    $('#experience-content').fadeIn(2000);

    // Set view URL parameter
    updateURLparams('experience/' + selected);
    
    // Append title div
    var html = '<div class="experience-title-container">' +
        '<div class="experience-title"><a href="' + experience[selected].url + '" target="_blank" class="company-logo-url"><img class="company-logo" src="' + experience[selected].logo + '"></a><div class="experience-subtitle">' + experience[selected].subtitle  + '</div></div>' +
        '<div class="experience-description">' + experience[selected].description + '</div></div>'; 

        $('#experience-content').append(html);

    // Append projects
    setTimeout( function() {
        addProjects = setInterval( addProject, 500 );
    }, 100 );
}

/* Add project elements for experiences */
var projectIndex = 0;
function addProject() {
    var project = experience[selected].projects[projectIndex];

    if( project == undefined ) {
        clearInterval(addProjects);
        return;
    }

   
    var containerCoords = {};
    var html;
    var selector;
    if( isMobile ) {
         // Convert % into px
        containerCoords = {
            x: $(window).width() / 2 + ( $(window).width() * (project.mobilelocation.x/100) ),
            y: ($(window).scrollTop() + $(window).height() / 2) + ( $(window).width() * (project.mobilelocation.y/100) )
        };

        var width = project.mobilewidth;

        html = '<div id="project-'+projectIndex+'" class="project-container" style="top: ' + containerCoords.y + 'px; left: ' + containerCoords.x + 'px; width:700px;"><div class="project-card-container">' + project.card + '</div>';

        // Add hover description 
        if( project.cardhovermobile.length > 300 ) {
            html += '<div class="hover-container"><div class="hover-content" style="font-size: 21px">' + project.cardhovermobile.replace('<br>','') + '</div></div></div>'; 
        } else {
            html += '<div class="hover-container"><div class="hover-content">' + project.cardhovermobile.replace('<br>','') + '</div></div></div>'; 
        }

        

        selector = 'left';

    } else {
         // Convert % into px
        containerCoords = {
            x: $(window).width() / 2 + ( $(window).width() * (project.location.x/100) ),
            y: ($(window).scrollTop() + $(window).height() / 2) + ( $(window).width() * (project.location.y/100) )
        };

        html = '<div id="project-'+projectIndex+'" class="project-container" style="top: ' + containerCoords.y + 'px; left: ' + containerCoords.x + 'px; width:' + project.width + 'px;">' + project.card;
    
        // Add hover description 
        html += '<div class="hover-container"><div class="hover-content">' + project.cardhover + '</div></div></div>'; 

        selector = project.selector;
    }

    // Add selector animation
        var direction = 'left';
        if( selector == 'left' ) {
            html += '<canvas id="canvas-'+projectIndex+'" width=80 height=150 style=" position: absolute; top: ' + parseInt(containerCoords.y+1) + 'px; left: ' + parseInt(containerCoords.x-78) + 'px;"></canvas>';

        } else if( selector == 'right' ) {
            direction = 'right';
            html += '<canvas id="canvas-'+projectIndex+'" width=80 height=150 style=" position: absolute; top: ' + parseInt(containerCoords.y+1) + 'px; left: ' + parseInt(containerCoords.x+243) + 'px;"></canvas>';
        }

    
        
    $('#experience-content').append(html);

    drawProjectSelector("canvas-"+projectIndex, direction);

    // Display project description
    if( !isMobile ) {
        setTimeout( function(i) {
            $('#project-'+i).css('display', 'block');
            $('#project-'+i).animate({height: project.height}, 300 );
        }, 900, projectIndex );
    } else {
        setTimeout( function(i) {
            $('#project-'+i).css('display', 'flex');
            $('#project-'+i).animate({height: 300}, 500 );
        }, 900, projectIndex );
    }
    
    projectIndex++;

    // Remove timer after iterating through all projects
    if( projectIndex >= experience[selected].projects.length ) {
        clearInterval(addProjects);
        projectIndex = 0;
        return;
    }
}

/* Handle company icon hover effect */
$(document).on('mouseover', '.company-icon', function() {
    //$(this).parent().find('.company-icon').show();
    $(this).parent().find('.company-icon-white').fadeOut();
    
});

$(document).on('mouseout', '.company-icon', function() {
    if( $(this).attr('selected') == undefined ) {
        $(this).parent().find('.company-icon-white').show();
    }
});

/* Handle company icon click */
$(document).on('click', '.icon-container', function() {

    // Remove styling
    $('.company-icon').css('opacity', '');
    $('.timeline-company-name-single').css('color', '');
    $('.timeline-company-name-double').css('color', '');
    $('.company-icon').removeAttr('selected');

    // Set opacity to 1
    $(this).find('.company-icon').css('opacity', 1);
    $(this).find('.company-icon-white').hide();

    // Add 'selected' attribute 
    $(this).find('.company-icon').attr('selected','');

    // Set selected text
    $(this).find('.timeline-company-name-single').css('color', 'white');
    $(this).find('.timeline-company-name-double').css('color', 'white');

    // Set selected company
    selected = $(this).attr('key');
    drawSelectedCompany();
});

/* Sets nav when user loads page from URL params */
function setNavSelection() {
    // Remove styling
    $('.company-icon').css('opacity', '');
    $('.timeline-company-name-single').css('color', '');
    $('.timeline-company-name-double').css('color', '');
    $('.company-icon').removeAttr('selected');

    $('.icon-container').each( function() {
        if( $(this).attr('key') == selected ) {

            // Set opacity to 1
            $(this).find('.company-icon').css('opacity', 1);
            $(this).find('.company-icon-white').hide();

            // Add 'selected' attribute 
            $(this).find('.company-icon').attr('selected','');

            // Set selected text
            $(this).find('.timeline-company-name-single').css('color', 'white');
            $(this).find('.timeline-company-name-double').css('color', 'white');
        }
    });
}

/* Handle scroll down in project view */
var wait = false;
$(window).bind( 'mousewheel', function(event) {
    if( wait ) {
        return;
    }
    startWait();

    // Scroll up
    if (event.originalEvent.wheelDelta >= 0) {
        var el = findNextId( selectedNavItem, -1);
        if( el != undefined ) {
            selectedNavItem = el;
        }
    }

    // Scroll down
    else {
        var el = findNextId( selectedNavItem, 1);
        if( el != undefined ) {
            selectedNavItem = el;
        }
    }

    displayScrollUpdate(el);
});

/* Set wait to control scrolling on mouse pads */
function startWait() {
    wait = true;
    setTimeout( function() {
        wait = false;
    }, 750 );
}

/* Scroll down button press */
$(document).on('click', '.scrolldown-icon', function() {
    var el = findNextId( selectedNavItem, 1);
    if( el != undefined ) {
        selectedNavItem = el;
    }

    displayScrollUpdate(el);
});

function displayScrollUpdate(el) {
    // Set selectedItem
    displayProjectContent( el.attr('id') );

    resetNavbar();
    el.addClass("subitem-selected");

    // If item is subnav item, display
    if( el.parent().attr('id').includes('subitems') ) {
        $('#' + el.parent().attr('id').split('-')[0]).addClass("subitem-selected");
        $('#' + el.parent().attr('id').split('-')[0]).height(30);

        // Count subitems
        var subitemCount = 0;
        el.parent().find('.left-nav-subitem').each( function() {
            subitemCount++;
        });

        el.parent().height( subitemCount*30);
    }
}


/* Returns next element for project navbar */
function findNextId( navItem, dir ) {
    console.log( navItem );
    var itemId = navItem.attr('id').split('-')[0];
    var el;
    var pos;

    // Find position of selected element
    $('#project-nav-container').children().each( function(i) {
        if( $(this).attr('id') == itemId ) {
            if( dir == 1 ) {
                pos = i+1;
            } else {
                pos = i-1;
            }
        }
    });

    // If pos is undefined, navItem is subnavItem
    if( pos == undefined ) {
        var parentNavItem;
        $('#project-nav-container').children().each( function(i) {
            var temp = $(this);
            $(this).children().each( function(i)  {
                if( $(this).attr('id') == itemId ) {
                    parentNavItem = temp;

                    if( dir == 1 ) {
                        pos = i+1;
                    } else {
                        pos = i-1;
                    }
                }
            });
        });

        // Find next element
        parentNavItem.children().each( function(i) {
            if( i == pos ) {
                el = $(this);
            }
        });

        // If el is undefined ( No more subnav items ), move to next main nav category
        if( el == undefined ) {
            var id = navItem.parent().attr('id');

            $('#project-nav-container').children().each( function(i) {
                if( $(this).attr('id') == id ) {
                    if( dir == 1 ) {
                        pos = i+1;
                    } else {
                        pos = i-2;
                    }
                }
            });

            // Find next element
            $('#project-nav-container').children().each( function(i) {
                if( i == pos ) {
                    el = $(this);
                }
            });
        }
        
    } else {
        // Find next element
        $('#project-nav-container').children().each( function(i) {
            if( i == pos ) {
                // If element has children, set el to first children
                if( $(this).children().length > 0 ) {
                    el = $(this).first();
                } else {
                    el = $(this);
                }
            }
        });

        // If next element has subitems, select next one
        if( el != undefined ) {
            var keyId = el.attr('id').split('-')[0];
            if( projects[selectedProject][keyId].content == undefined ) {
                el = $('#' + keyId + '-subitems');
                if( dir == 1 ) {
                    el = el.children().eq(0);
                } else {
                    el = el.children().eq( el.children().length-1 );
                }
            }
        }
    }
    
    return el;
}

function getNextId( pos, direction ) {
    if( direction == 1 ) {
        var id;
        // Check for subnavs


        if( Object.keys(projects[selectedProject])[pos+1] != undefined ) {
            id = Object.keys(projects[selectedProject])[pos+1];
        } else {
            id = Object.keys(projects[selectedProject])[pos]; 
        }
    }

    selectedNavItem = $('#' + id );

    return id;
}

/* Slide over image on hover */
$(document).on('mouseover', '.navigator-overview-img', function() {
    $(this).animate({
        'right': '20px'
    }, 750 );
});

/* Slide back image on mouseleave */
$(document).on('mouseleave', '.navigator-overview-img', function() {
    $(this).animate({
        'right': '-350px'
    }, 750 );
});