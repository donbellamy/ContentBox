/**
 * ContentBox - A Modular Content Platform
 * Copyright since 2012 by Ortus Solutions, Corp
 * www.ortussolutions.com/products/contentbox
 * ---
 * Export ContentBox data based on user selection. This is a transient object
 */
component accessors=true {

	/**
	 * The exporters to use
	 */
	property name="exporters" type="array";

	/**
	 * Describes what will be exported
	 */
	property name="descriptor" type="struct";

	/**
	 * The location of the data services used for exporting
	 */
	property name="dataServiceMappings" type="struct";

	/**
	 * The location of the file mappings used for exporting
	 */
	property name="filePathMappings" type="struct";

	// DI
	property name="moduleSettings" inject="coldbox:setting:modules";
	property name="entryService" inject="id:entryService@cb";
	property name="pageService" inject="id:pageService@cb";
	property name="categoryService" inject="id:categoryService@cb";
	property name="contentStoreService" inject="id:contentStoreService@cb";
	property name="menuService" inject="id:menuService@cb";
	property name="securityRuleService" inject="id:securityRuleService@cb";
	property name="authorService" inject="id:authorService@cb";
	property name="roleService" inject="id:roleService@cb";
	property name="permissionService" inject="id:permissionService@cb";
	property name="settingService" inject="id:settingService@cb";
	property name="securityService" inject="id:securityService@cb";
	property name="moduleService" inject="id:moduleService@cb";
	property name="themeService" inject="id:themeService@cb";
	property name="widgetService" inject="id:widgetService@cb";
	property name="siteService" inject="id:siteService@cb";
	property name="templateService" inject="id:emailtemplateService@cb";
	property name="log" inject="logbox:logger:{this}";
	property name="zipUtil" inject="zipUtil@cb";
	property name="dataExporter" inject="id:dataExporter@cbadmin";
	property name="fileExporter" inject="id:fileExporter@cbadmin";
	property name="wirebox" inject="wirebox";
	property name="HTMLHelper" inject="HTMLHelper@coldbox";

	/**
	 * Constructor
	 */
	ContentBoxExporter function init(){
		variables.exporters           = [];
		variables.descriptor          = {};
		variables.dataServiceMappings = {};
		variables.filePathMappings    = {};

		return this;
	}

	/**
	 * On DI Complete
	 */
	function onDIComplete(){
		var contentBoxPath = variables.moduleSettings[ "contentbox" ].path;
		var customPath     = variables.moduleSettings[ "contentbox-custom" ].path;

		variables.dataServiceMappings = {
			"authors" : {
				fileName    : "authors",
				service     : "authorService",
				displayName : "Authors",
				priority    : 3
			},
			"categories" : {
				fileName    : "categories",
				service     : "categoryService",
				displayName : "Categories",
				priority    : 1
			},
			"contentstore" : {
				fileName    : "contentstore",
				service     : "contentStoreService",
				displayName : "Content Store",
				priority    : 4
			},
			"entries" : {
				fileName    : "entries",
				service     : "entryService",
				displayName : "Entries",
				priority    : 4
			},
			"menus" : {
				fileName    : "menus",
				service     : "menuService",
				displayName : "Menus",
				priority    : 5
			},
			"pages" : {
				fileName    : "pages",
				service     : "pageService",
				displayName : "Pages",
				priority    : 4
			},
			"permissions" : {
				fileName    : "permissions",
				service     : "permissionService",
				displayName : "Permissions",
				priority    : 1
			},
			"permissionGroups" : {
				fileName    : "permissionGroups",
				service     : "permissionGroupService",
				displayName : "Permission Groups",
				priority    : 2
			},
			"roles" : {
				fileName    : "roles",
				service     : "roleService",
				displayName : "Roles",
				priority    : 2
			},
			"securityrules" : {
				fileName    : "securityrules",
				service     : "securityRuleService",
				displayName : "Security Rules",
				priority    : 1
			},
			"settings" : {
				fileName    : "settings",
				service     : "settingService",
				displayName : "Settings",
				priority    : 1
			},
			"sites" : {
				fileName    : "site",
				service     : "siteService",
				displayName : "Site",
				priority    : 1
			}
		};

		variables.filePathMappings = {
			"emailtemplates" : {
				fileName    : "emailtemplates",
				displayName : "Email Templates",
				directory   : contentBoxPath & "/email_templates",
				type        : "template",
				extension   : "",
				priority    : 1
			},
			"medialibrary" : {
				fileName    : "medialibrary",
				displayName : "Media Library",
				directory   : expandPath(
					variables.settingService.getSetting( "cb_media_directoryRoot" )
				),
				includeFiles : "*",
				type         : "folder",
				extension    : "",
				priority     : 1
			},
			"modules" : {
				fileName    : "modules",
				displayName : "Modules",
				directory   : customPath & "/_modules",
				type        : "folder",
				extension   : "",
				priority    : 1
			},
			"themes" : {
				fileName    : "themes",
				displayName : "Themes",
				directory   : customPath & "/_themes",
				type        : "folder",
				extension   : "",
				priority    : 1
			},
			"widgets" : {
				fileName    : "widgets",
				displayName : "Widgets",
				directory   : customPath & "/_widgets",
				type        : "component",
				extension   : ".cfc",
				priority    : 1
			}
		};
	}

	/**
	 * Setup method to configure service
	 *
	 * @targets The struct of targets to prepare for export
	 */
	ContentBoxExporter function setup( required struct targets ){
		// loop over targets and build up exporters
		for ( var key in arguments.targets ) {
			// find config for the given key
			var config = findConfig( key );
			// if config was not found, continue to next one.
			if ( !structCount( config ) ) {
				continue;
			}

			switch ( config.type ) {
				// add data exporter
				case "data":
					var exporter = wirebox.getInstance( "dataExporter@cbadmin" );
					exporter.setFileName( config.def.fileName );
					exporter.setDisplayName( config.def.displayName );
					exporter.setContent( variables[ config.def.service ].getAllForExport() );
					exporter.setPriority( config.def.priority );
					break;
					// add file exporter
				case "file":
					var includedFiles = !isBoolean( arguments.targets[ key ] ) && listLen(
						arguments.targets[ key ]
					) ? arguments.targets[ key ] : "*";
					var exporter = wirebox.getInstance( "fileExporter@cbadmin" );
					exporter.setFileName( config.def.fileName );
					exporter.setDisplayName( config.def.displayName );
					exporter.setDirectory( config.def.directory );
					exporter.setType( config.def.type );
					exporter.setExtension( config.def.extension );
					// set included files dynamically from arguments
					exporter.setIncludeFiles( includedFiles );
					break;
					// add exporter
			}
			addExporter( exporter );
		}
		return this;
	}

	/**
	 * Adds an exporter that will define how a particular resource is exported
	 * @exporter.hint The exporter that is added
	 * return SiteExporterService
	 */
	ContentBoxExporter function addExporter( required any exporter ){
		arrayAppend( exporters, arguments.exporter );
		return this;
	}

	/**
	 * Gets the descriptor def for the export
	 */
	struct function getDescriptor(){
		// build descriptor
		buildDescriptor();
		return variables.descriptor;
	}

	/**
	 * Processes export!
	 */
	struct function export(){
		var exportLog = createObject( "java", "java.lang.StringBuilder" ).init(
			"Starting ContentBox package export...<br>"
		);
		// do some directory checking/creating
		var tmpDirectory = getTempDirectory() & "cbexport";
		if ( directoryExists( tmpDirectory ) ) {
			directoryDelete( tmpDirectory, true );
		}
		directoryCreate( tmpDirectory );
		// process exporters
		for ( var exporter in exporters ) {
			if ( isInstanceOf( exporter, "cbadmin.models.exporters.DataExporter" ) ) {
				exportLog.append( "Beginning export of #exporter.getDisplayName()#<br />" );
				var fileName = tmpDirectory & "/" & exporter.getFileName() & "." & exporter.getFormat();
				exportLog.append( "#arrayLen( exporter.getContent() )# records found<br />" );
				fileWrite( fileName, serializeJSON( exporter.getContent() ) );
				exportLog.append( "Export of #exporter.getDisplayName()# complete!<br />" );
			}
			if ( isInstanceOf( exporter, "cbadmin.models.exporters.FileExporter" ) ) {
				var fileName = tmpDirectory & "/" & exporter.getFileName() & "." & exporter.getFormat();
				// if all files, just grab directory
				if ( exporter.getIncludeFiles() == "*" ) {
					exportLog.append( "Beginning export of all #exporter.getDisplayName()#<br />" );
					zipUtil.addFiles(
						zipFilePath = fileName,
						directory   = exporter.getDirectory(),
						recurse     = true
					);
					exportLog.append( "Export of all #exporter.getDisplayName()# complete!<br />" );
				} else {
					exportLog.append(
						"Beginning export of #exporter.getDisplayName()#: #exporter.getFileList()#<br />"
					);
					if ( exporter.getType() == "folder" ) {
						var folders = listToArray( exporter.getFileList() );
						var tmppath = tmpDirectory & "/tmp_" & exporter.getFileName();
						// create temp directory for selected folders
						directoryCreate( tmppath );
						// loop over matches
						for ( var folder in folders ) {
							// copy folder to tmp directory
							directoryCopy(
								folder,
								tmppath & "/" & listLast( folder, "/" ),
								true
							);
						}
						// now add tmp to zip file
						zipUtil.addFiles(
							zipFilePath = fileName,
							directory   = tmppath,
							recurse     = true
						);
						// finally, we can delete that now
						directoryDelete( tmppath, true );
					} else {
						zipUtil.addFiles(
							zipFilePath = fileName,
							files       = exporter.getFileList(),
							recurse     = true
						);
					}
					exportLog.append( "Export of #exporter.getDisplayName()# complete!<br />" );
				}
			}
		}
		exportLog.append( "Creating package descriptor file<br />" );
		// add descriptor file
		fileWrite( tmpDirectory & "/descriptor.json", serializeJSON( getDescriptor() ) );
		exportLog.append( "Package descriptor complete!<br />" );

		// done! now we just need to compress the whole thing
		exportLog.append( "Generating ContentBox package export<br />" );

		var exportFile = tmpDirectory & "/cbsite.cbox";
		zipUtil.addFiles(
			zipFilePath = exportFile,
			directory   = tmpDirectory,
			recurse     = true
		);
		exportLog.append( "ContentBox package export complete!<br />" );

		var flattendExportLog = exportLog.toString();
		log.info( flattendExportLog );

		return { "exportfile" : exportFile, exportlog : flattendExportLog };
	}

	/**
	 * Retrieves correct config defintion based on key arguments
	 *
	 * @key The key of the definition to find.
	 *
	 * @return Struct of { type : "data|file", def : data service mapping }
	 */
	private struct function findConfig( required string key ){
		var isData = structKeyExists( variables.dataServiceMappings, arguments.key );
		var isFile = structKeyExists( variables.filePathMappings, arguments.key );
		if ( isData ) {
			return {
				"type" : "data",
				"def"  : variables.dataServiceMappings[ arguments.key ]
			};
		}
		if ( isFile ) {
			return {
				"type" : "file",
				"def"  : variables.filePathMappings[ arguments.key ]
			};
		}
		return {};
	}

	/**
	 * Creates descriptor structure
	 */
	private void function buildDescriptor(){
		var loggedInUser        = variables.securityService.getAuthorSession();
		var content             = {};
		// set static descriptor values
		content[ "exportDate" ] = now();
		content[ "exportedBy" ] = "#loggedInUser.getFirstName()# #loggedInUser.getLastName()# (#loggedInUser.getUsername()#)";
		content[ "content" ]    = {};
		// add dynamic content
		for ( var exporter in exporters ) {
			content[ "content" ][ exporter.getFileName() ] = {
				"total"    : exporter.getTotal(),
				"name"     : exporter.getDisplayName(),
				"format"   : exporter.getFormat(),
				"filename" : exporter.getFileName() & "." & exporter.getFormat(),
				"priority" : exporter.getPriority()
			};
		}
		setDescriptor( content );
	}

}