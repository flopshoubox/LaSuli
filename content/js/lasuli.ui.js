include("resource://lasuli/modules/Observers.js");
include("resource://lasuli/modules/Sync.js");  
lasuli.ui = {
  initTabs : function()
  {
    $tabs = $('#tabs').tabs({
      tabTemplate: '<li><a href="#{href}" class="tab-viewpoint">#{label}</a> <span class="ui-icon ui-icon-close">Remove Tab</span></li>',
      selected:0,
      add: function(event, ui) {
        $(ui.panel).append('' + ui.panel.id);
      },
      remove: function(event, ui)
      {
        //debug(ui.panel.id);
        if($('#' + ui.panel.id))
          $('#' + ui.panel.id).remove();
      }
    });
    
    $tabs.bind('tabsselect', function(event, ui) {
      //jsHighLighter.removeHighlighter();
      if($(ui.tab).hasClass("tab-add"))
      {
      }
    });
  },
  
  initDocumentPanel : function(){
    var browsingUrl = "http://cassandre/text/d0";
    Observers.notify("lasuli.core.actionLoadDocument", browsingUrl);
  },
  
  initViewpointPanel : function(){
    var logger = Log4Moz.repository.getLogger("lasuli.ui.listViewpoints");
    $('#btn-create-viewpoint').button({
			label: 'Create',
			icons: {
				primary: 'ui-icon-circle-plus'
			}
		});
		var resizeInput = function(){
		  $('div#create-viewpoint input').width( $('#tabs').innerWidth() - 130);
		};
		//Resize the input box
		$(window).resize(resizeInput);
		resizeInput();
		
		//Bind the button to create the viewpoint
		$('div#create-viewpoint button').click(function(){
		  var viewpointName = $.trim($(this).prev().val());
		  if(viewpointName == "")
		  {
		    alert("viewpoint name cannot be null");
		    return false;
		  }
		  logger.debug("Create viewpoint button click.\nViewpoint name:" + viewpointName);
		  Observers.notify("lasuli.core.actionCreateViewpoint", viewpointName);
		});
		
		//Noticy the core to load all viewpoints.
		Observers.notify("lasuli.core.actionListViewpoints", null);
		
		//When click enter key also create viewpoint
		$('#txtViewpoint').keyup(function(event){
      if (event.keyCode == 13)
        $('#btn-create-viewpoint').trigger('click');
    });
    
		$('#viewpoints-ul li').live('mouseover', function(){
      $(this).find("img").stop().animate({opacity: 1}, 250);
      //$(this).stop().animate({marginLeft : -26}, 250);
    });
    $('#viewpoints-ul li').live('mouseout', function(){
      $(this).find("img").stop().animate({opacity: 0}, 250);
      //$(this).stop().animate({marginLeft : 0}, 250);
    });
    //Click the trash icon to delete a viewpoint
    $('.icon-remove-viewpoint').live('click', function(){
      var viewpointID = $(this).parent().attr('id');
      var viewpointName = $(this).next().text();
      var message = {};
      message.title = _("Warning");
      message.content = _("delete.viewpoint.warning", [viewpointName]);
      message.callback = function() {
        Observers.notify("lasuli.core.actionDestroyViewpoint", viewpointID);
      };
      Observers.notify("lasuli.ui.showMessage", message);
    });
  },
  
  initAttributeGrid : function(){
    
    $("#attribute-dialog").dialog({
      bgiframe: true,
      autoOpen: false,
      modal: true,
      width: 170,
      title: _("add-attribute-dialog-title"),
      buttons: {
        'OK': function() {
          var bValid = true;
          $('#attribute-name').removeClass('ui-state-error');
          $('#attribute-value').removeClass('ui-state-error');
          if ( $('#attribute-name').val().length == 0)
          {
            $('#attribute-name').addClass('ui-state-error');
            bValid = false;
          }
          
          if ( $('#attribute-value').val().length == 0) 
          {
            $('#attribute-value').addClass('ui-state-error');
            bValid = false;
          }
          
          if (bValid) {
            var attribute = {"name": $('#attribute-name').val(), "value": $('#attribute-value').val()};
            Observers.notify("lasuli.core.actionCreateAttribute", attribute);
            $('#attribute-dialog').dialog('close');
          }
        }
      },
      close: function() 
      {
        $('#attribute-name').removeClass('ui-state-error');
        $('#attribute-value').removeClass('ui-state-error');
      }
    });
    
    $('#attribute-name').keyup(function(event){
      if (event.keyCode == 13)
        $('#attribute-value').focus().select();
    });
    $('#attribute-value').keyup(function(event){
      if (event.keyCode == 13)
        $('#attribute-dialog').dialog('option','buttons').OK();
    });
    
    //If the jqGrid script isn't loaded yet.
    while(!("jqGrid" in $("#attribute-grid")))
      Sync.sleep(10);
    
		$("#attribute-grid").jqGrid({
      url: "#",
      datatype: "local",
      height: "100%",
      width: "98%",
      colNames:[_('name'),_('value')],
      colModel:[
           {name:'name', index:'name',editable:true},
           {name:'value', index:'value',editable:true}    
         ],
      sortname: 'name',
      viewrecords: true,
      sortorder: "desc",
      multiselect: false,
      cellsubmit: 'clientArray',
      toolbar: [true, "bottom"],
      caption: _("attributes")
    });
    $(window).bind('resize', function() {
        $("#attribute-grid").setGridWidth($('#h3-entity-name').width());
    }).trigger('resize');
    //initial toolbar
    $('#t_attribute-grid').html("<button id='attribute-del'></button><button id='attribute-modify' class='hide'></button><button id='attribute-add'></button>");
    $('#attribute-add').button({
			text: false,
			icons: {
				primary: 'ui-icon-plus'
			}
		}).click(function(){ $('#attribute-dialog').dialog('open'); });
		  
		//Delete selected attribute
		$('#attribute-del').button({
			text: false,
			icons: {
				primary: 'ui-icon-trash'
			}
		}).click(function(){
		  var gr = $("#attribute-grid").jqGrid('getGridParam','selrow');
      if( gr != null )
      {
        var data = $("#attribute-grid").jqGrid('getRowData',gr);
        var attribute = {"name": data.name, "value": data.value};
        Observers.notify("lasuli.core.actionDestroyAttribute", attribute);
      }
      else
      {
        var message = {};
        message.title = _("Warning");
        message.content = _("no-attribute-selected");
        Observers.notify("lasuli.ui.showMessage", message);
      }
		});
		//Modify selected attribute
		/*$('#attribute-modify').button({
			text: false,
			icons: {
				primary: 'ui-icon-pencil'
			}
		}).click(function(){
		  var gr = $("#attribute-grid").jqGrid('getGridParam','selrow');
      if( gr != null )
        $('#attribute-dialog').dialog('open');
      else
      {
        var message = {};
        message.title = _("Warning");
        message.content = _("no-attribute-selected");
        Observers.notify("lasuli.ui.showMessage", message);
      }
		});*/
  },
  
  initTagCloud : function(){
    $("#tags").contextMenu({
        menu: "tagcloudContextMenu"
    },
    function(action, el, pos) 
    {
      switch(action)
      {
        case "tagcloudSwitcher":
          if($("#tags ul").hasClass("alt"))
            $("#tags ul").hide().removeClass("alt").fadeIn("fast");
          else
            $("#tags ul").hide().addClass("alt").fadeIn("fast");
          return;
        case "tagcloudSortAlphabetically":
          if($(".tagcloudSortAlphabetically").data("desc"))
          {
            $("#tags ul li").tsort({order:"desc"});
            $(".tagcloudSortAlphabetically").data("desc", false);
          }
          else
          {
            $(".tagcloudSortAlphabetically").data("desc", true);
            $("#tags ul li").tsort({order:"asc"});
          }
          return;
        case "tagcloudSortByStrength":
          if($(".tagcloudSortByStrength").data("desc"))
          {
            $(".tagcloudSortByStrength").data("desc", false);
            $("#tags ul li").tsort({order:"asc",attr:"class"});
          }
          else
          {
            $(".tagcloudSortByStrength").data("desc", true);
            $("#tags ul li").tsort({order:"desc",attr:"class"});
          }
          return;
      }
    });
  },
  
  //Auto register all observers
  register: function(){
    var logger = Log4Moz.repository.getLogger("lasuli.ui.register");
    for(var func in this)
      if(func.substr(0, 4) == "show")
      {
        //logger.debug("registering function: " + func);
        Observers.add("lasuli.ui." + func, lasuli.ui[func], lasuli.ui);
      }
  },
  unregister: function(){
    for(var func in this)
      if(func.substr(0, 4) == "show")
        Observers.remove("lasuli.ui." + func, lasuli.ui[func], lasuli.ui);
  },
  
  showMessage : function(subject, data){
    var msgTitle = (typeof(subject.title) == "string") ? subject.title : "Information";
    $("#message").html(subject.content);
    if(subject.callback)
    {
      $("#message-dialog").dialog('destroy');
      var i18nButtons = {};
      i18nButtons[_('Cancel')] = function() { $(this).dialog('close');  };
  	  i18nButtons[_('Okay')] = function() { $(this).dialog('close');  subject.callback();  };
      $("#message-dialog").dialog({
        autoOpen: true,
        modal: true,
        width: 150,
        buttons: i18nButtons
      });
    }
    else
    {
    	var i18nButtons = {};
      i18nButtons[_('Okay')] = function() { $(this).dialog('close');  };
      $("#message-dialog").dialog('destroy');
      $("#message-dialog").dialog({
        bgiframe: true,
        autoOpen: true,
        modal: true,
        width: 150,
        buttons: i18nButtons
      });
    }
    $("#ui-dialog-title-message-dialog").html(msgTitle);
  },
  
  showViewpoints : function(subject,data){
    var logger = Log4Moz.repository.getLogger("lasuli.ui.showViewpoints");
    logger.debug(subject);
    $('#viewpoints-ul li').hide().remove();
  
    if(subject)
    $.each(subject,function(i,viewpoint){
      $("#viewpoints-ul").append("<li id='" + viewpoint.id + "'><img src='css/blitzer/images/delete.png' class='icon-remove-viewpoint'><a>"
                                 + viewpoint.name + "</a></li>");
    });
  },
  
  showUsers : function(users){
    $("#actors ul li").hide().remove();
    if(!users) return;
    users.sort();
    for(var i=0, user; user = users[i]; i++)
    {
      var content = "<li class='actor'><a uri='" + user + "'>" + user + "</a></li>";
      $("#actors ul").append(content);
    }
  },
  
  showItemName : function(itemName){
    var logger = Log4Moz.repository.getLogger("lasuli.ui.showItemName");
    logger.debug(itemName);
    if(!itemName) itemName = _("no.name");
    $("#h3-entity-name").html(itemName);
  },
  
  showAttributes : function(attributes){
    var logger = Log4Moz.repository.getLogger("lasuli.ui.showAttributes");
    logger.debug(attributes);
    $("#attribute-grid").jqGrid('clearGridData');
    if(!attributes) return false;
    var index = 1;
    for(var name in attributes)
      if(typeof(attributes[name]) == "string")
      {
        logger.debug({"name": name, "value": attributes[name]});
        $("#attribute-grid").addRowData(index, {"name": name, "value": attributes[name]});
        index++;
      }
      else
      for(var j=0, v; v = attributes[name][j]; j++)
      {
        logger.debug({"name": name, "value": v});
        $("#attribute-grid").addRowData(index, {"name": name, "value": v});
        index++;
      }
  },
  
  showTopics : function(topics){
    $("#tags ul li").hide().remove();
    if(!topics) return false;
    
    var max = 0;
    var min = 32768;
    for(var name in topics)
    {
      if(topics[name].length > max) max = topics[name].length;
      if(topics[name].length < min) min = topics[name].length;
    }
    //var_dump("UI.init.js", "max:" + max + ", min:" + min, 4);
    for(var name in topics)
    {
      var size = Math.round((topics[name].length - min) / (max-min) * 4) + 1;
      //var_dump("UI.init.js", "topics[name].length:" + topics[name].length, 4);
      var content = "<li class='tag" + size + "'><a>" + name + "</a></li>";
      $("#tags ul").append(content);
    }
    $(".tagcloudSortAlphabetically").data("desc", true);
    $("#tags ul li").tsort({order:"asc"});
  }
}


$(window).bind("load", function(){
  lasuli.jqGirdLoader();
  lasuli.ui.register();
  lasuli.ui.initTabs();
  lasuli.ui.initViewpointPanel();
  lasuli.ui.initAttributeGrid();
  lasuli.ui.initTagCloud();
  lasuli.ui.initDocumentPanel();
  
});

$(window).bind("unload", function(){
  lasuli.ui.unregister();
});