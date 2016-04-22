$( document ).ready(function() {
    
    // If the sidebar preference is off, toggle it
    if( $( "body" ).attr( "data-showsidebar" ) == "no" ){
        toggleSidebar();
    }
    // If "main-content-sidebar" exists then bring toggler in
    if( $( "#main-content-sidebar").attr( 'id' ) !== undefined ){
        $( "#main-content-sidebar-trigger" ).fadeIn();
    }

    // setup global variables
    $confirmIt          = $( '#confirmIt' );
    $remoteModal        = $( "#modal" );
    
    // Attach modal listeners
    attachModalListeners();
    
    // Global Tool Tip Settings
    toolTipSettings = {
         animation  : 'slide',
         delay      : { show: 100, hide: 100 }
    };
    
    // Search Capabilities
    activateContentSearch();
    // activate confirmations
    activateConfirmations();
    // activate tooltips
    activateTooltips();
    // activate navbar state
    activateNavbarState();

    // global Validaiton settings
    $.validator.setDefaults( {
        // apparently, the *default* of jQuery validation is to ignore validation of hidden elements (e.g., when using tabs, validation is skipped)
        // seriously???
        // anyway, setting ignore: [] fixes it
        ignore:[],
        //errorElement: 'span',
        //errorClass: 'help-block',
        highlight: function(element) {
            $(element).closest('.form-group').removeClass('success').addClass('error');
        },
        success: function(element) {
            element
                .text( 'Field is valid' )
                .addClass('valid')
                .closest('.form-group').removeClass('error').addClass('success');
            element.remove();
        },
        errorPlacement: function(error, element) {
            if($(element).is(":hidden")){
                return false;
            }else{
                error.appendTo( element.closest( "div.controls" ) );
            }
        }
    } );
    $.fn.resetValidations = function() {
        var form = this[ 0 ].currentForm;
        // also remove success and error classes
        $( form ).find( '.form-group' ).each(function() {
            $( this ).removeClass( 'error' ).removeClass( 'success' );
        } );
        $( form ).find( ':input' ).each(function() {
            $( this ).removeClass( 'error' ).removeClass( 'valid' );
        } );
        return this;
    };
    // simple method to blank out all form fields 
    $.fn.clearForm = function() {
        if( this.data( 'validator') === undefined ){ return; }
        // reset classes and what not
        this.data( 'validator' ).resetForm();
        // run over input fields and blank them out
        this.find(':input').each(function() {
            switch(this.type) {
                case 'password':
                case 'hidden':
                case 'select-multiple':
                case 'select-one':
                case 'text':
                case 'textarea':
                    $(this).val('');
                    break;
                case 'checkbox':
                case 'radio':
                    this.checked = false;
            }
        } );
        $( this.data( 'validator' ) ).resetValidations();
        return this;
    };
    $.fn.collect = function() {
        var serializedArrayData = this.serializeArray();
        var data = {};
        $.each( serializedArrayData, function( index, obj ) {
            data[ obj.name ] = obj.value;
        } );
        return data;
    };

    // flicker messages
    var t = setTimeout( toggleFlickers(), 5000 );

    // Tab link detector for bootstrap
    $( function(){
        var activeTab = $( '[href="' + location.hash + '"]' );
        if( activeTab ){ activeTab.tab( 'show' ); }
    } );
    
    // Nav Search Shortcut
    jwerty.key( 
        "ctrl+shift+s/\\", 
        function(){ 
            $( "#nav-search" ).focus(); 
            return false; 
        } 
    );
    
    // find all links with the key-binding data attribute
    $( '[data-keybinding]' ).each(function(){
        var boundItem = $( this );
        jwerty.key( boundItem.data( 'keybinding' ), function(){ 
            // give precedence to onclick
            if( boundItem.attr( 'onclick' ) ) {
                // if onclick, call event
                boundItem.click();
            } else {
                // otherwise, follow link
                to( boundItem.attr( 'href' ) );
            } 
        } );
    } );

    // Hide empty menu's due to permissions.
    $( "#main-navbar li.nav-dropdown" ).each( function(){
        if( !$( this ).find( "ul.nav-sub li" ).length ){
            $( this ).hide();
        }
    } );

    // match stateful accordions
    $( '.accordion[data-stateful]' ).each(function() {
        var accordion = $( this ),
            data = accordion.data( 'stateful' ),
            match;
        if( data ) {
            // try to retrieve cookie that matches accordion panel id
            match = $.cookie( data );
            // if a match was found...
            if ( match !== null ) {
                // wax defaults that are hardcoded on the template
                accordion.find( '.collapse' ).removeClass( 'in' );
                //show the matched group
                $( '#' + match ).addClass( 'in' );
            }
        }
        // bind listener for state changes
        accordion.bind( 'shown.bs.collapse', function(){
            // grab id from expanded accordion panel
            var active = accordion.find( '.in' ).attr( 'id' );
            // set cookie
            $.cookie( data, active );
        } );           
    } );

     
} );

/**
 * Activate the main sidebar state to open or closed
 */
function activateNavbarState(){
    var container = $( "#container" );
    // Bind listener to left toggle action
    $( '#toggle-left' ).bind( 'click', function(e) {
        console( 'toggle clicked' );
        // Setup state according to width
        var state = container.hasClass( "sidebar-opened" );
        if( $( window ).width() > 768 ){
            state = container.hasClass( "sidebar-mini" );
        }
        // Store cookie
        $.cookie( "sidemenu-collapse", state );

        console( 'toggle cookie saved' );
    } );
}
/**
 * Check if the main right sidebar is open or not
 * @return {Boolean} open or not
 */
function isMainSidebarOpen(){
    var sidebar = $( "#main-content-sidebar" );
    return ( sidebar.attr( "id" ) !== undefined && sidebar.css( "display" ) === "block"  ? true : false );
}
/**
 * Toggle the main sidebar to fully display the main slot of content.
 * main-content-slot (col) main-content-sidebar (col)
 */
function toggleSidebar(){
    var sidebar         = $( "#main-content-sidebar" );
    var type            = sidebar.css( "display" );
    var sidebarState    = false;
    
    // nosidebar exit
    if( type === undefined ){ return; }

    // toggles
    if( type === "block" ){
        sidebar.fadeOut();
        $( "#main-content-sidebar-trigger i" ).removeClass( "fa-minus-square-o" ).addClass( "fa-plus-square-o" );
        $( "#main-content-slot" ).removeClass( "col-md-8" ).addClass( "col-md-12" );
    } else {
        $( "#main-content-sidebar-trigger i" ).removeClass( "fa-plus-square-o" ).addClass( "fa-minus-square-o" );
        sidebar.fadeIn();
        $( "#main-content-slot" ).removeClass( "col-md-12" ).addClass( "col-md-8" );
        sidebarState = true;
    }

    // Call change user editor preference
    $.ajax( {
        url     : $( "#main-content-sidebar-trigger" ).attr( "data-stateurl" ),
        data    : { sidebarState : sidebarState },
        async   : true
    } );
}
/**
 * Run an admin action async
 * @param  {string} action    Target action to execute
 * @param  {string} actionURL The posting executor
 */
function adminAction( action, actionURL ){
    if( action != 'null' ){
        $( "#adminActionsIcon" ).addClass( "fa-spin textOrange" );
        // Run Action Dispatch
        $.post( actionURL , { targetModule : action}, function( data ){
            if( data.ERROR ){
                adminNotifier( "error", "<i class='fa-exclamation-sign'></i> <strong>Error running action, check logs!</strong>" );
            } else {
                adminNotifier( "info", "<i class='fa-exclamation-sign'></i> <strong>Action Ran, Booya!</strong>" );
            }
            $( "#adminActionsIcon" ).removeClass( "fa-spin textOrange" );
        } );
    }
}
/**
 * Send an admin notifier popup for a few seconds
 * @param type The type to send: Defaults to warn, available are warning, info, error, success
 * @param message The message to display in the notifier
 * @param delay The delay of the message, defaults to 1500 ms
 */
function adminNotifier( type, message, delay ){
    toastr.options = {
        "closeButton"       : true,
        "preventDuplicates" : true,
        "progressBar"       : true,
        "showDuration"      : "300",
        "timeOut"           : "2000",
        "positionClass"     : "toast-top-center"
    };
    switch( type ){
        case "info" : { toastr.info( message ); break; }
        case "error" : { toastr.error( message ); break; }
        case "success" : { toastr.success( message ); break; }
        case "warning" : { toastr.warning( message ); break; }
        default : {
            toastr.info( message ); break;
        }
    }
    
}
function activateContentSearch(){
    // local refs
    $nav_search         = $( "#nav-search" );
    $nav_search_results = $( "#div-search-results" );
    // opacity
    $nav_search.css( "opacity","0.8" );
    // focus effects
    $nav_search.focusin( function(){
        //if( $nav_search.is( ":focus" ) ){ return; }
        $( this ).animate( {
                opacity: 1.0,
                width  : '+=250',
            }, 
            500, 
            function(){} 
        );
    } ).blur( function(){
        $( this ).animate( {
                opacity: 0.50,
                width  : '-=250',
            }, 
            500, 
            function(){}
        );
    } );
    // keyup quick search
    $nav_search.keyup(function(){
        var $this = $(this);
        // Only send requests if more than 2 characters
        if( $this.val().length > 1 ){
            $nav_search_results.load( $( "#nav-search-url" ).val(), { search: $this.val() }, function(data){
                if( $nav_search_results.css( "display" ) === "none" ){
                    $nav_search_results.fadeIn().slideDown();
                }
            } );
        }
        
    } );
    // add click listener to body to hide quick search panel
    $( 'body' ).click( function( e ){
       var target = $( e.target ),
           ipTarget = target.closest( '#div-search' );
       // if click occurs within visible element, add to ignore list
       if( !ipTarget.length ){
           //run global hide methods
           closeSearchBox();
       }
    } );
}
function closeSearchBox(){
    $( "#div-search-results" ).slideUp();
    $( "#nav-search" ).val( '' );
}
function quickLinks( inURL ){
    if( inURL != 'null' ){
        window.location = inURL;
    }
}
function activateTooltips(){
    //Tooltip 
    $( '[title]' ).tooltip( toolTipSettings );
}
function hideAllTooltips(){
    $( ".tooltip" ).hide();
}
function toggleFlickers(){
    $( ".flickerMessages" ).slideToggle();
    $( ".flickers" ).fadeOut( 3000 );
}
/**
 * Close the remote loaded modal
 */
function closeRemoteModal(){
    $remoteModal.modal( 'hide' );
}
/**
 * Reset a modal form according to the passed container
 * @param  {object} container The container
 */
function resetContainerForms( container ){
    // Clears a form in the div element, usually to reset forms in dialogs.
    var frm = container.find( 'form' );
    if( frm.length ) {
        $( frm[ 0 ] ).clearForm();
    }
}
/**
* Close a local modal window
* @param div The jquery div object that represents the dialog.
*/
function closeModal( div ){
    div.modal( 'hide' );
}
/**
 * Open a new local modal window based on a div container
 * @param div The jquery object of the div to extract the HTML from.
 * @param w The width of the modal
 * @param h The height of the modal
 */
function openModal( div, w, h ){
    // Open the modal
    div.modal();
    // attach a listener to clear form when modal closes
    $( div ).on( 'hidden.bs.modal', function() {
        resetContainerForms( $( this ) );
    } );
}
/**
 * Open a new remote modal window Ajax style.
 * @param url The URL ajax destination
 * @param data The data packet to send
 * @param w The width of the modal
 * @param h The height of the modal
 * @param delay Whether or not to delay loading of dialog until after dialog is created (useful for iframes)
 * @return
 */
function openRemoteModal( url, params, w, h, delay ){
    // if no URL, set warning and exit
    if( !url ){
        console.log( "URL needed" );
        return;
    }
    var modal = $remoteModal;
    var args = {};
    var maxHeight   = ( $( window ).height() - 200 );
    var maxWidth    = ( $( window ).width() * 0.85 );
    
    // Set default values for modal data elements
    modal.data( 'url', url );
    modal.data( 'params', params );
    modal.data( 'width', w !== undefined ? w : maxWidth );
    modal.data( 'height', h !== undefined ? h : maxHeight );

    // convert height percentage to a numeric value
    var height = modal.data( 'height' );
    if( height.search && height.search( '%' )!== -1 ) {
        height = height.replace( '%', '' ) / 100.00;
        height = $( window ).height() * height;
    }
    // Check max heights conditions
    if( height > maxHeight ) {
        height = maxHeight;
    }
    modal.data( 'height', height );
    
    // in delay mode, we'll create a modal and then load the data (seems to be necessary for iframes to load correctly)
    if( delay ) {
        modal.data( 'delay', true );
        modal.modal();
    }
    // otherwise, front-load the request and then create modal
    else {
        // load request for content modal
        modal.load( url, params, function() {
            // Show modal, once content has being retrieved
            modal.modal();
        } );
    }
    return;
}

/**
 * Resize the modal content preview window
 * @param {object} activeBtn The active button object
 * @param {numeric} w The width to use in pixels
 */
function setPreviewSize( activeBtn, w ){
    var modalDialog = $remoteModal.find( ".modal-dialog" ),
        frame       = $( "#previewFrame" ).length ? $( "#previewFrame" ) : modalDialog,
        orig        = { 'width' : $remoteModal.data( 'width' ) },
        modalSize   = { 'width' : w };

    // width is bigger than original size, reset to original
    if( !w || modalSize.width > orig.width ){ 
        modalSize = { 'width' : orig.width }; 
    }

    // toggle "Quick Preview" on Mobile Views
    $remoteModal.find( ".header-title" ).toggle( modalSize.width > 600 );
    // Set current active buttons
    $( activeBtn ).siblings( '.btn-primary' ).removeClass( 'btn-primary' ).addClass( "btn-info" );
    $( activeBtn ).removeClass( "btn-info" ).addClass( 'btn-primary' );

    // resize it now.
    modalDialog.animate( modalSize, 500 );
}
/**
 * Attach modal listeners to global modals: Remote and ConfirmIt
 */
function attachModalListeners(){
    // Remote show event: Usually we resize the window here.
    $remoteModal.on( 'show.bs.modal', function() {
        var modal = $remoteModal;
        modal.find( '.modal-dialog' ).css( {
            width     : modal.data( 'width' ),
            height    : modal.data( 'height' )
        } );
    } );
    // Remote shown event: Delayed loading of content
    $remoteModal.on( 'shown.bs.modal', function() {
        var modal = $remoteModal;
        // only run if modal is in delayed mode
        if( modal.data( 'delay' ) ) {
            modal.load( modal.data( 'url' ), modal.data( 'params' ), function(){
                modal.find('.modal-dialog').css( {
                    width     : modal.data( 'width' ),
                    height    : modal.data( 'height' )
                } );
            } );
        }        
    } );
    // Remote hidden event: Reset loader
    $remoteModal.on( 'hidden.bs.modal', function() {
        var modal = $remoteModal;
        // reset modal html
        modal.html( '<div class="modal-header"><h3>Loading...</h3></div><div class="modal-body" id="removeModelContent"><i class="fa fa-spinner fa-spin fa-lg fa-4x"></i></div>' );
        // reset container forms
        resetContainerForms( modal );
    } );
}
/**
 * Close confirmation modal
 */
function closeConfirmations(){
    $confirmIt.modal( 'hide' );
}
/**
 * Activate modal confirmation windows
 */
function activateConfirmations(){
    // close button triggers for confirmation dialog
    $confirmIt.find( "button" ).click(function(e){
        if( $(this).attr( "data-action" ) === "confirm" ){
            $confirmIt.find( "#confirmItButtons" ).hide();
            $confirmIt.find( "#confirmItLoader" ).fadeIn();
            window.location =  $confirmIt.data('confirmSrc');
        }
    } );
    
    // Activate dynamic confirmations from <a> of class confirmIt
    $( ".confirmIt" ).click( function( e ){
        // setup the href
        $confirmIt.data( "confirmSrc", $(this).attr('href'));
        // defaults
        var dataMessage = $(this).attr('data-message') ? $(this).attr('data-message') : 'Are you sure you want to perform this action?';
        var dataTitle = $(this).attr('data-title') ? $(this).attr('data-title') : 'Are you sure?';
        // set message
        $confirmIt.find( "#confirmItMessage" ).html( dataMessage );
        // set title
        $confirmIt.find( "#confirmItTitle" ).html( dataTitle );
        // show the confirmation when clicked
        //$confirmIt.data( "overlay" ).load();
        $confirmIt.modal();
        // prevent default action
        e.preventDefault();
    } );
}
function popup(url,w,h){
    var winWidth = 1000;
    var winHeight = 750;
    if( w ){ minWidth = w; }
    if( h ){ winHeight = h; }
    var xPosition = (screen.width / 2) - (winWidth / 2);
    var yPosition = (screen.height / 2) - (winHeight / 2);
    window.open(url,'layoutPreview','resizable=yes,status=yes,location=no,menubar=no,toolbar=no,scrollbars=yes,width='+winWidth+',height='+winHeight+',left='+xPosition+',top='+yPosition+',screenX='+xPosition+',screenY='+yPosition);
}
/**
 * Relocation shorcuts
 * @param link
 * @returns {Boolean}
 */
function to(link){
    window.location = link;
    return false;
}
/**
 * Check all checkboxes utility function
 * @param checked
 * @param id
 */
function checkAll(checked,id){
    $( "input[name='"+id+"']" ).each(function(){
        this.checked = checked;
    } );
}
/**
 * Check all checkboxes by value
 * @param id
 * @param recordID
 * @returns
 */
function checkByValue(id,recordID){
    $( "input[name='" + id + "']" ).each(function(){
        if( this.value === recordID ){ this.checked = true; }
        else{ this.checked = false; }
    } );    
}
/**
 * Get today's date in us or rest of the world format
 * @param {boolean} us defaults to true
 */
function getToday( us ){
    // default us to true
    us = ( us == null ? true : us );
    if( us ){
        return moment().format( "YYYY-MM-DD" );
    } else {
        return moment().format( "DD-MM-YYYY" ); 
    }
}