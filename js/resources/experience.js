/* Experience entries are stored as a Javascript object */
var experience = {
    "MOENA": {
        icon: 'images/moena/icon.png',
        iconwhite: 'images/moena/icon-white.png',
        logo: 'images/moena/logo.png',
        mobilelogo: 'images/mobile/moena.png',
        url: 'http://moena.us',
        subtitle: 'Founder &nbsp;|&nbsp; 2013 - Present',
        description: 'Moena is a software development company that builds custom enterprise applications for a wide variety of clients. We provide quality solutions for all web, mobile and cloud application needs.',
        projects: [
            {   // Navigator
                location: { x: -35, y: -19 },
                mobilelocation: { x: -35, y: -75 },
                destination: { x: -75, y: 73 },
                card: "<img src='images/moena/navigator/navigator.png' class='navigator-logo'><img src='images/moena/navigator/navigator-interface.png' class='navigator-img'>",
                cardhover: "Navigator is a web based laboratory information management system designed for MRG Labs to streamline their grease and oil analysis process.<div onclick='cameraZoom(-75,73,\"navigator\")' class='more-details-btn' style='margin-left: 60px; margin-top: 40px;'>DETAILS</div>",
                cardhovermobile: "Navigator is a web based laboratory information management system designed for MRG Labs to streamline their grease and oil analysis process.<div onclick='cameraZoom(-75,73,\"navigator\")' class='more-details-btn' style='margin-left: 110px; margin-top: 25px;'>DETAILS</div>",
                details: '',
                selector: "left",
                width: '245',
                height: '200'
            },
            {   // IronRide
                location: { x: -5, y: -13.5 },
                mobilelocation: { x: -42, y: -42 },
                card: "<img src='images/moena/ironride/ironride-logo.png' class='ironride-logo'><img src='images/moena/ironride/ironride.png' class='ironride-img'>",
                cardhover: "IronRide is a social media app for motorcycle riders to connect and<br> find popular riding routes. <div onclick='cameraZoom(92,45,\"ironride\")' class='more-details-btn' style='margin-left: 60px; margin-top: 50px;'>DETAILS</div>",
                cardhovermobile: "IronRide is a social media app for motorcycle riders to connect and<br> find popular riding routes. <div onclick='cameraZoom(92,45,\"ironride\")' class='more-details-btn' style='margin-left: 110px; margin-top: 50px;'>DETAILS</div>",
                details: '',
                selector: "left",
                width: '245',
                height: '200'
            },
            {   // FAST
                location: { x: -12, y: 3.5 },
                mobilelocation: { x: -35, y: -9 },
                card: "<img src='images/moena/fast/fast.png' class='fast-logo'><img src='images/moena/fast/fast-interface.png' class='fast-img'>",
                cardhover: "FAST is a comprehensive analysis web platform designed to assess mental fitness. It provides clients with immediate mental fitness results and suggestions for improvement as well as a statistical analysis platform for administrators. <div class='more-details-btn' style='margin-left: 60px; margin-top: 21px;' onclick='cameraZoom(60,-84,\"fast\")'>DETAILS</div>",
                cardhovermobile: "FAST is a comprehensive analysis web platform designed to assess mental fitness. It provides clients with immediate mental fitness results and suggestions for improvement as well as a statistical analysis platform for administrators. <div class='more-details-btn' style='margin-left: 110px; margin-top: 21px;' onclick='cameraZoom(60,-84,\"fast\")'>DETAILS</div>",
                details: '',
                selector: "right",
                width: '245',
                height: '200'
            },
            {   // Commonwealth Trailers
                location: { x: -34, y: 1 },
                mobilelocation: { x: -25, y: 24 },
                card: "<img src='images/moena/keystone/commonwealth-logo.png' class='commonwealth-logo'><img src='images/moena/keystone/Commonwealth.png' class='commonwealth-img'>",
                cardhover: "Commonwealth Trailer Parts is a trailer parts resale company that requested a redesign of their <br>website.<div class='more-details-btn' style='margin-left: 60px; margin-top: 45px;' onclick='cameraZoom(-84,-36,\"commonwealth\")'>DETAILS</div>",
                cardhovermobile: "Commonwealth Trailer Parts is a trailer parts resale company that requested a redesign of their <br>website.<div class='more-details-btn' style='margin-left: 110px; margin-top: 45px;' onclick='cameraZoom(-84,-36,\"commonwealth\")'>DETAILS</div>",
                details: '',
                selector: "left",
                width: '245',
                height: '200'
            }
        ]
    },
    "COMMONWEALTH OF PENNSYLVANIA": {
        icon: 'images/cop/icon.png',
        iconwhite: 'images/cop/oa-white.png',
        logo: 'images/cop/logo.png',
        mobilelogo: 'images/mobile/cop.png',
        url: 'http://www.oa.pa.gov/Pages/default.aspx',
        subtitle: 'Data Analyst Internship &nbsp;|&nbsp; Spring 2016',
        description: 'The Office of Administration is responsible for managing the business support for all other state agencies, boards, and commissions. It also manages the state\'s emergency broadcast system.',
        projects: [
            {   // Webscraper
                location: { x: -38, y: -13 },
                card: "<img src='images/cop/webscraper/webscraper-logo.png' class='webscraper-logo'><img src='images/cop/webscraper/webscraper.png' class='webscraper-img'>",
                cardhover: "The Office of Administration was tasked with auditing all Commonwealth websites to verify that their data sets were publicly accessible. I built a webscraper that searches multiple websites simultaneously to find the data sets.<br><div class='more-details-btn' style='margin-left: 60px; margin-top: 22px;'>DETAILS</div>",
                details: '',
                selector: "left",
                width: '245',
                height: '200'
            },
            {   // Code4PA
                location: { x: -12, y: 2 },
                card: "<img src='images/cop/code4pa/code4pa.png' class='code4pa-img'>",
                cardhover: "Code4PA is a hackathon that encourages learning, collaboration, growth, innovation, and fun among PA’s network of technical talent. I was brought on as a consultant to help organize the event.<div class='more-details-btn' style='margin-left: 60px; margin-top: 30px;'>DETAILS</div>",
                details: '',
                selector: "right",
                width: '245',
                height: '200'
            }
        ]
    },
    // "KIOWARE": {
    //     icon: 'images/kioware/icon.png',
    //     iconwhite: 'images/kioware/iconwhite.png',
    //     logo: 'images/kioware/logo.png', 
    //     mobilelogo: 'images/mobile/kioware.png', 
    //     url: 'https://www.kioware.com/default.aspx',
    //     subtitle: 'Software Engineering Internship &nbsp;|&nbsp; Spring & Fall 2015',
    //     description: 'Kioware provides kiosk browser software that secures Windows and Android devices in a lockdown kiosk mode. They also offer cloud services to remotely monitor and control kiosks.',
    //     projects: [
    //         {   // Settings Importer
    //             location: { x: -36, y: -13 },
    //             card: "<div class='project-title'>Settings Converter</div><img src='images/kioware/conversion.png' class='conversion-img'>",
    //             cardhover: "I used .NET to create an XML to <br>JSON converter that allows customers to import their Kioware Classic configurations into the new version of Kioware.",
    //             details: '',
    //             selector: "left",
    //             width: '245',
    //             height: '200'
    //         },
    //         {   // POS
    //             location: { x : -5, y: -14 },
    //             card: "<div class='project-title'>Point of Sales GUI</div><img src='images/kioware/pos.jpg' class='pos-img'>",
    //             cardhover: "I developed a point of sales web application for a KioWare client using .NET and a MySQL database.<br><br>The interface allows cafeteria workers to select items and handle purchases through KioWare.",
    //             details: '',
    //             selector: "left",
    //             width: '245',
    //             height: '200'
    //         },
    //         {   // Hardware
    //             location: { x : -15, y: 4.75 },
    //             card: "<div class='project-title'>Hardware Integration</div><img src='images/kioware/hardware.png' class='hardware-img'>",
    //             cardhover: "KioWare clients frequently request custom hardware configurations in addition to a traditional kiosk and it was my responsibility to integrate that hardware with KioWare.<br><br>I learned how to use datasheets and libraries for various devices and handle USB communications using Java and C#.",
    //             details: '',
    //             selector: "right",
    //             width: '245',
    //             height: '200'
    //         }
    //     ]
    // },
    // "JOHNSON CONTROLS": {
    //     icon: 'images/jci/icon.png',
    //     iconwhite: 'images/jci/iconwhite.png',
    //     logo: 'images/jci/logo.png', 
    //     mobilelogo: 'images/mobile/jci.png', 
    //     url: 'http://www.johnsoncontrols.com/',
    //     subtitle: 'Software Engineering Internship &nbsp;|&nbsp; Summer 2016',
    //     description: 'Johnson Controls is a Fortune 500 company that produces HVAC, security, and management systems for buildings, batteries and electronics for the automotive industry, and distributed energy storage solutions.',
    //     projects: [
    //         {   // Settings Importer
    //             location: { x: -47, y: -19 },
    //             card: "<div class='project-title-small'>Quality Assurance Automation</div><img src='images/jci/chiller.png' class='chiller-img'>",
    //             cardhover: "The YK Centrifugal Chiller is a water cooled, industrial air conditioner used in a variety of applications such as skyscrapers and data centers.<br><br>I automated the QA process by simulating user interactions with the control panel using Python. Automating the QA process  ",
    //             details: '',
    //             selector: "right",
    //             width: '245',
    //             height: '200'
    //         },
    //         { 
    //             location: { x: 100, y: 500 },
    //             title: "BUILD AUTOMATION REFACTORING",
    //             content: "Project content"
    //         }
    //     ]
    // },
    // "PATTON ELECTRONICS": {
    //     icon: 'images/patton/icon.png',
    //     iconwhite: 'images/patton/icon.png',
    //     logo: 'images/patton/logo.png', 
    //     mobilelogo: 'images/mobile/patton.png',
    //     url: 'https://www.patton.com/',
    //     subtitle: 'Software Engineering Internship | Summer 2015',
    //     description: 'Patton Electronics builds VoIP, Ethernet extension, and high availability router technologies for enterprise and industrial networks.',
    //     projects: [
    //         { 
    //             location: { x: 100, y: 500 },
    //             title: "QUALITY ASSURANCE AUTOMATION",
    //             content: "Project content"
    //         },
    //         { 
    //             location: { x: 100, y: 500 },
    //             title: "BUILD AUTOMATION REFACTORING",
    //             content: "Project content"
    //         }
    //     ]
    // }
    
}