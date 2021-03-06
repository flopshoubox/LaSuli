include("resource://lasuli/modules/Observers.js");
include("resource://lasuli/modules/Sync.js");
include("resource://lasuli/modules/Preferences.js");
include("resource://lasuli/modules/Base64.js");

lasuli.ui = {
  initTabs : function(){
    var logger = Log4Moz.repository.getLogger("lasuli.ui.initTabs");
    $tabs = $('#tabs').tabs({
      tabTemplate: '<li><a href="#{href}" class="tab-viewpoint">#{label}</a> <span class="ui-icon ui-icon-close">Remove Tab</span></li>',
      selected:0,
      add: function(event, ui) {
        //logger.trace(ui.tab.href);
        var viewpointPanelHtml = '<span class="ui-widget-header ui-corner-all toolbar"><button class="modify">' + _("modify") + '</button>'
                               + '<span class="buttonset hide"><button class="okay">' + _("delete") + '</button><button class="cancel">' + _("Cancel") + '</button></span></span>'
                               + '<div class="topics" ><p class="h3-title"><span>' + _("Index") + '</span>'
                          		 + '<img class="add-topic-img" src="css/blitzer/images/add.png"></p><ul class="topics-ul"></ul></div>'
                          		 + '<div class="fragments-container"><p class="h3-title"><span>' + _("Analysis") + '</span>'
                          		 + '<img class="add-analyses-img" src="css/blitzer/images/add.png"></p></div>';
        $(ui.panel).append(viewpointPanelHtml);
        $('.toolbar button.modify').button({ icons: { primary: "ui-icon-pencil"} });
        $('.toolbar span button.okay').button({ icons: { primary: "ui-icon-check"} });
        $('.toolbar span button.cancel').button({ icons: { primary: "ui-icon-close"} });
        $('.toolbar span.buttonset').buttonset();
      },
      remove: function(event, ui)
      {
        //logger.trace(ui);
        if($('#' + ui.panel.id))
          $('#' + ui.panel.id).remove();
      }
    });

    $tabs.bind('tabsselect', function(event, ui) {
      var logger = Log4Moz.repository.getLogger("lasuli.ui.initTabs.tabsselect");
      //logger.trace($(ui.tab).attr("class"));

      if($(ui.tab).hasClass("tab-viewpoint"))
      {
        var viewpointID = $(ui.tab).attr("href").substr(1);
        //logger.trace(viewpointID);
        _p(30);
        dispatch("lasuli.ui.doClearViewpointPanel", viewpointID);
        _p(50);
        dispatch("lasuli.core.doLoadKeywords", viewpointID);
        _p(70);
        dispatch("lasuli.core.doLoadFragments", viewpointID);
        _p(100);
      }
      else
        dispatch('lasuli.contextmenu.doHide', null);

      if($(ui.tab).hasClass("tab-document"))
      {
        dispatch("lasuli.core.doLoadDocument", null);
      }
      if($(ui.tab).hasClass("tab-add"))
      {
        //logger.trace("lasuli.core.doListViewpoints");
        dispatch("lasuli.core.doListViewpoints", null);
        dispatch('lasuli.highlighter.doClear', null);
      }
      $("div.ui-tabs-panel").height($(window).height() - $('ul.ui-tabs-nav').outerHeight() - 56);
      $("#config-panel").height($(window).height() - 56);
    });

    $('#tabs span.ui-icon-close').die().live('click', function() {
      var index = $('li',$tabs).index($(this).parent());
      $tabs.tabs('remove', index);
      return false;
    });

    $(window).bind('resize', function() {
      var logger = Log4Moz.repository.getLogger("lasuli.ui.initTabs.window.resize");
      //logger.debug($('.toolbar').innerWidth());
      $("div.ui-tabs-panel").height($(window).height() - $('ul.ui-tabs-nav').outerHeight() - 56);
      $("#config-panel").height($(window).height() - 56);
    }).trigger('resize');

    $('#h3-related-topics').html(_('topics'));
    $('#tab-document-title').html(_('document'));
    $('#span-viewpoint-list').html(_('viewpoints'));
    $('#config').bind('click', lasuli.ui.initConfigPanel);
    $('#config-panel button.ok').button({ icons: { primary: "ui-icon-check" }}).bind('click', lasuli.ui.doSaveConfiguration);
    $('#config-panel button.add').button({ icons: { primary: "ui-icon-plusthick" }}).bind('click', lasuli.ui.doAddServerField);
    $('#config-panel button.delete').live('click', lasuli.ui.doRemoveServerField);
  },

	initConfigPanel: function(){
		$('#tabs').slideToggle({duration: 500, easing: 'easeInSine', complete: function(){
			$('#config-panel').slideToggle({duration: 500, easing: 'easeInSine', complete: function(){
				if($('#config-panel').css('display') != 'block') return false;
				//Remove all none related panel
				$('#config-panel').find('fieldset[id!="default-server"]').remove();
				var servers = Preferences.get("extensions.lasuli.setting",JSON.stringify(new Array()));
				//alert(servers);
      	if(typeof(servers) == "string") servers = JSON.parse(servers);
				for(var i=0, server; server = servers[i]; i++)
    		if(server.default === true)
    		{
    			$('#default-server input.url').val(server.url);
    			$('#default-server input.user').val(server.user);
    			$('#default-server input.pass').val(server.pass);
    		}
    		else
    		{
    			$field = lasuli.ui.doAddServerField();
    			$field.find('input.url').val(server.url);
    			$field.find('input.user').val(server.user);
    			$field.find('input.pass').val(server.pass);
    		}		
				}});
			}
		});
	},
	
  initDocumentPanel : function(){
    var logger = Log4Moz.repository.getLogger("lasuli.ui.initDocumentPanel");
    //logger.trace("initDocumentPanel");
    //var browsingUrl = "http://cassandre/text/d0";
    dispatch("lasuli.core.doLocationChange", null);
  },

  initPlusPanel : function(){
    var logger = Log4Moz.repository.getLogger("lasuli.ui.initViewpointPanel");
    $('#btn-create-viewpoint').button({
			label: _('Create'),
			icons: {
				primary: 'ui-icon-circle-plus'
			}
		}).click(function(){
		  var viewpointName = $.trim($(this).prev().val());
		  if(viewpointName == "")
		  {
		    var message = {"title": _("Warning"), "content": _('create.viewpoint.warning')};
		    dispatch("lasuli.ui.doShowMessage", message);
		    return false;
		  }
		  //logger.trace("Create viewpoint button click.\nViewpoint name:" + viewpointName);
		  dispatch("lasuli.core.doCreateViewpoint", viewpointName);
		});

		var resizeInput = function(){
		  $('div#create-viewpoint input').width( $('#tabs').innerWidth() - 130);
		};
		//Resize the input box
		$(window).resize(resizeInput);
		resizeInput();

    $('#txtViewpoint').focus(function(){ $(this).select(); });

		//When click enter key also create viewpoint
		$('#txtViewpoint').keyup(function(event){
      if (event.keyCode == 13)
        $('#btn-create-viewpoint').trigger('click');
    });

		$('#viewpoints-ul li').die().live('mouseover', function(){
      $(this).find("img").stop().animate({opacity: 1}, 250);
      return false;
    });
    $('#viewpoints-ul li').die().live('mouseout', function(){
      $(this).find("img").stop().animate({opacity: 0}, 250);
      return false;
    });
    //Click the trash icon to delete a viewpoint
    $('.icon-remove-viewpoint').die().live('click', function(){
      var viewpointID = $(this).parent().attr('uri');
      var viewpointName = $(this).next().text();
      var message = {};
      message.title = _("Warning");
      message.content = _("delete.viewpoint.warning", [viewpointName]);
      message.callback = function() {
        dispatch("lasuli.core.doDestroyViewpoint", viewpointID);
      };
      dispatch("lasuli.ui.doShowMessage", message);
      return false;
    });
    $('#viewpoints-ul li a').die().live('click', function(){
      var logger = Log4Moz.repository.getLogger("lasuli.ui.initViewpointPanel.viewpoint.click");
      var viewpointID = $(this).parent().attr("uri");
      var viewpointName = $(this).text();
      var viewpoints = new Array({"id": viewpointID, "name": viewpointName});
      //logger.trace(viewpoints);
      dispatch("lasuli.ui.doShowViewpointPanels", viewpoints);
      return false;
    });
  },

  initViewpointPanel : function(){
    var logger = Log4Moz.repository.getLogger("lasuli.ui.initViewpointPanel");
    //init toolbar
    $('.toolbar button.modify').die().live('click', function(){
      $(this).hide().next().show();
      var viewpointDiv = $(this).parents('div');
      viewpointDiv.find("input.cb-remove-keyword").show();
      viewpointDiv.find("img.fragment-toggle").each(function(){
        var el = $(this);
        $(this).parent().data("img", el);
        $(this).replaceWith("<input type='checkbox' class='cb-analysis-topic'>");
      });
      viewpointDiv.find("li.fragment span.ui-icon").each(function(){
        var el = $(this);
        $(this).parent().data("span", el);
        $(this).replaceWith("<input type='checkbox' class='cb-fragment'>");
      });
      return false;
    });
    $('.toolbar button.cancel').die().live('click', function(){
      $(this).parent().hide().prev().show();
      var viewpointDiv = $(this).parents('div');
      viewpointDiv.find("input.cb-remove-keyword").hide().removeAttr("checked");
      viewpointDiv.find("input.cb-analysis-topic").each(function(){
        var el = $(this).parent().data("img");
        $(this).replaceWith(el);
      });
      viewpointDiv.find("input.cb-fragment").each(function(){
        var el = $(this).parent().data("span");
        $(this).replaceWith(el);
      });
      return false;
    });
    $('.toolbar button.okay').die().live('click', function(){
      $(this).parent().hide().prev().show();
      var viewpointDiv = $(this).parents('div');
      var viewpointID = $(this).parents('.ui-tabs-panel').attr("id");
      var num = viewpointDiv.find("input:checked").length;
      if(num == 0) num = 1;
      _p([0,num]);
      var i=0;
      viewpointDiv.find("input.cb-remove-keyword").each(function(){
        if($(this).attr("checked"))
        {
          var topicID = $(this).next("a").attr("uri");
          var name = $(this).next("a").html();
          dispatch("lasuli.core.doDestroyKeyword", {"topicID":topicID, "viewpointID": viewpointID, "name": name});
          _p([i++,num]);
        }
        $(this).hide().removeAttr("checked");
      });

      viewpointDiv.find("input.cb-fragment").each(function(){
        if($(this).attr("checked"))
        {
          var fragmentID = $(this).parent().attr("fragmentID");
          var viewpointID = $(this).parent().attr("viewpointID");
          var topicID = $(this).parent().attr("topicID");
          var itemID = $(this).parent().attr("itemID");
          dispatch("lasuli.core.doDestroyFragment", {"fragmentID": fragmentID, "viewpointID": viewpointID, "topicID": topicID});
        }
        var el = $(this).parent().data("span");
        $(this).replaceWith(el);
        _p([i++,num]);
      });

      viewpointDiv.find("input.cb-analysis-topic").each(function(){
        if($(this).attr("checked"))
        {
          var topicID = $(this).parent().attr("topicID");
          var name = $(this).next().text();
          dispatch("lasuli.core.doDestroyAnalysis", {"viewpointID":viewpointID, "topicID": topicID, "name": name});
        }
        var el = $(this).parent().data("img");
        $(this).replaceWith(el);
        _p([i++,num]);
      });

      _p([num,num]);
      return false;
    });
    //Click the analysis topic will check all fragments
    $('input.cb-analysis-topic').live('click', function(){
      $(this).parent().next().find("li input.cb-fragment").attr("checked", true);
    });
    //Mouse over the tag shows the trash icon
    $(".topic").die().live("mouseover", function(){
      $(this).find("img").removeClass("hide");
      return false;
    }).die().live("mouseout", function(){
      $(this).find("img").addClass("hide");
      return false;
    });

    //Edit in place of a tag
    $(".topic a").die().live("click", function(event){
      var el = $(this);

      //Save the content for future restore it back
      var container = $('ul.topics-ul');
      container.data("topicName", $(this).html());
      container.data("topicID", $(this).attr("uri"));

      el.replaceWith("<input type='text' class='edit-in-place' value=''>");
      var in_element = container.find("input");
      in_element.val(container.data("topicName"));
      in_element.focus().select();

      in_element.blur(function(){
        var topicID = container.data("topicID");
        //var_dump("[UI.init.js] edit in place topic name", uri, 4);
        var viewpointID = $(this).parents('.ui-tabs-panel').attr("id");
        var topicName = container.data("topicName");
        var topicNewName = $(this).val();
        dispatch("lasuli.core.doRenameKeyword", {"viewpointID":viewpointID, "topicID":topicID, "name": topicName, "newName": topicNewName});
        return false;
      });

      in_element.keyup(function(event){
        if (event.keyCode == 27)
        {
          $(this).replaceWith("<a uri='" + container.data("topicID") + "'>" + container.data("topicName") + "</a>");
        }
        if (event.keyCode == 13)
        {
          $(this).blur();
        }
      });

      event.stopImmediatePropagation();
      return false;
    });

    //Open dialog for add topic
    $('.add-topic-img').die().live("click", function(){
      $("#topic-tree-dialog").dialog('open');
      return false;
    });

    //Initial topic tree dialog
    $("#topic-tree-dialog").dialog({
      bgiframe: true,
      autoOpen: false,
      modal: true,
      width: 170,
      title: _("topictree.dialog.title"),
      buttons: {'ok': function(){}},
      close: function(){
        $("#tree").jstree('destroy');
      },
      open: function(){
        $('div#topic-tree-dialog').nextAll('div.ui-dialog-buttonpane').find('div').html("<button class='tt-tag'></button><button class='tt-create'></button><button class='tt-modify'></button><button class='tt-delete'></button>");

        $('.tt-tag').button({
    			text: false, disabled: true,
    			icons: { primary: 'ui-icon-tag' }
    		}).click(function(){
    		  if($.jstree._focused().data.ui.selected[0])
    		  {
    		    var el = $.jstree._focused().data.ui.selected[0];
    		    if($(el).attr("rel") == "keyword")
    		      lasuli.ui.jstree_contextmenu.items($(el)).untag.action();
    		    else
    		      lasuli.ui.jstree_contextmenu.items($(el)).tag.action();
    		  }
    		});

        $('.tt-create').button({
    			text: false, disabled: true,
    			icons: { primary: 'ui-icon-plus' }
    		}).click(function(){
    		  if($.jstree._focused().data.ui.selected[0])
    		  {
    		    var el = $.jstree._focused().data.ui.selected[0];
    		    lasuli.ui.jstree_contextmenu.items($(el)).add.action();
    		  }
    		});

    		$('.tt-delete').button({
    			text: false, disabled: true,
    			icons: { primary: 'ui-icon-trash' }
    		}).click(function(){
    		  if($.jstree._focused().data.ui.selected[0])
    		  {
    		    var el = $.jstree._focused().data.ui.selected[0];
    		    lasuli.ui.jstree_contextmenu.items($(el)).destroy.action();
    		  }
    		});

    		$('.tt-modify').button({
    			text: false, disabled: true,
    			icons: { primary: 'ui-icon-pencil' }
    		}).click(function(){
    		  if($.jstree._focused().data.ui.selected[0])
    		  {
    		    var el = $.jstree._focused().data.ui.selected[0];
    		    $("#tree").jstree("rename", $(el));
    		  }
    		});
        var viewpointID = $('div#tabs li.ui-tabs-selected a').attr('href').substr(1);
        dispatch("lasuli.core.doLoadTopicTree", viewpointID);
      }
    });
    $("#topic-tree-dialog li").die().live('click', function(){
      switch($(this).attr('rel')){
        case 'viewpoint':
          $('.tt-tag').button({ disabled: true });
          $('.tt-create').button({ disabled: false });
          $('.tt-delete').button({ disabled: true });
          $('.tt-modify').button({ disabled: false });
          break;
        case 'keyword':
          $('.tt-tag').button({ disabled: false, icons: { primary: 'ui-icon-untag' } });
          $('.tt-create').button({ disabled: false });
          $('.tt-delete').button({ disabled: false });
          $('.tt-modify').button({ disabled: false });
          break;
        case 'analysis':
          $('.tt-tag').button({ disabled: true });
          $('.tt-create').button({ disabled: false });
          $('.tt-delete').button({ disabled: false });
          $('.tt-modify').button({ disabled: false });
          break;
        default:
          $('.tt-tag').button({ disabled: false, icons: { primary: 'ui-icon-tag' } });
          $('.tt-create').button({ disabled: false });
          $('.tt-delete').button({ disabled: false });
          $('.tt-modify').button({ disabled: false });
          break;
      }
      return false;
    });
    //Topic side icon click
    $(".fragment-toggle").die().live('click', function(event){
      if($(this).attr('src').indexOf('toggle-close.png') > 0)
      {
        $(this).parent().next().slideUp({duration: 1000, easing: 'easeOutBounce'});
        $(this).attr('src','css/blitzer/images/toggle-open.png');
        return false;
      }
      if($(this).attr('src').indexOf('toggle-open.png') > 0)
      {
        $(this).parent().next().slideDown({duration: 600, easing: 'easeInBounce'});
        $(this).attr('src','css/blitzer/images/toggle-close.png');
        return false;
      }
    });

    $("li.fragment").live("mouseover", function(){
      $(this).find("span.ui-icon").removeClass("ui-icon-arrowthick-2-n-s").addClass("ui-icon-trash");
    });

    $("li.fragment").live("mouseout", function(){
      $(this).find("span.ui-icon").removeClass("ui-icon-trash").addClass("ui-icon-arrowthick-2-n-s");
    });

    $("li.fragment em.fragment-text").live("click", function(){
      var fragmentID = $(this).parent().attr("fragmentID");
      dispatch("lasuli.highlighter.doScrollTo", fragmentID);
      return false;
    });

    //Delete fragment
    $("li.fragment span.ui-icon-trash").live("click", function(){
      var fragmentID = $(this).parent().attr("fragmentID");
      var viewpointID = $(this).parent().attr("viewpointID");
      var topicID = $(this).parent().attr("topicID");
      var itemID = $(this).parent().attr("itemID");
      dispatch("lasuli.core.doDestroyFragment", {"fragmentID": fragmentID, "viewpointID": viewpointID, "topicID": topicID});
      return false;
    });

    //Add analysis topic
    $('.add-analyses-img').die().live("click", function(){
      var viewpointID = $(this).parents("div.ui-tabs-panel").attr("id");
      dispatch("lasuli.core.doCreateAnalysis", viewpointID);
      return false;
    });

    //Edit analysis topic
    $('.fragment-header span').die().live('click', function(event){
      var divContainer = $(this).parent();
      var originalSpan = $(this).clone();
      var originalTopicName = $(this).text();
      var img = $(this).prev();
      var originalImage = img.attr('src');
      //img.attr('src','css/blitzer/images/delete.png');
      //var_dump("[UI.init.js] fragment header edit", $(this).html(), 4);
      $(this).replaceWith("<input type='text' class='edit-in-place' value=''>");
      var in_element = divContainer.find("input");
      in_element.val(originalSpan.html());
      in_element.focus().select();

      in_element.blur(function(){
        var viewpointID = divContainer.attr("viewpointID");
        var topicID = divContainer.attr("topicID");
        var newName = $(this).val();

        if(newName == originalTopicName)
        {
          //Sleep 500ms for capture the click on the delete icon
          Sync.sleep(500);
          dispatch("lasuli.ui.doRestoreAnalysis", {
            "viewpointID": viewpointID, "topicID": topicID, "name": originalTopicName,
            "newName": newName, "originalSpan": originalSpan, "originalImage": originalImage});
        }
        else
          dispatch("lasuli.core.doRenameAnalysis", {
            "viewpointID": viewpointID, "topicID": topicID, "name": originalTopicName,
            "newName": newName, "originalSpan": originalSpan, "originalImage": originalImage});
      });
      in_element.keyup(function(event){
        if (event.keyCode == 27)
        {
          $(this).replaceWith(originalSpan);
          setTimeout("restoreImg('" + originalImage + "');", 500);
        }
        if (event.keyCode == 13)
          $(this).blur();
      });
      event.stopImmediatePropagation();
      return false;
    });
  },

  initAttributeGrid : function(){
    var attributesDialogButtons = {};
  	attributesDialogButtons[_('Okay')] = function() {
  	  var bValid = true;
      $('#attribute-name').removeClass('ui-state-error');
      $('#attribute-value').removeClass('ui-state-error');
      var attributeName = $('#attribute-name').val();
      var attributeValue = $('#attribute-value').val();
      if ( attributeName.length == 0)
      {
        $('#attribute-name').addClass('ui-state-error');
        bValid = false;
      }

      if ( attributeValue.length == 0)
      {
        $('#attribute-value').addClass('ui-state-error');
        bValid = false;
      }

      if (bValid) {
        var attribute = {"name": attributeName, "value": attributeValue};
        dispatch("lasuli.core.doCreateAttribute", attribute);
        $('#attribute-dialog').dialog('close');
      }
    };

    $("#attribute-dialog").dialog({
      bgiframe: true,
      autoOpen: false,
      modal: true,
      width: 170,
      title: _("attribute.dialog.title"),
      buttons: attributesDialogButtons,
      open: function(){
        $('#attribute-name').val('').focus().select();
        $('#attribute-value').val('');
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
      {
        var buttons = $('#attribute-dialog').dialog('option','buttons');
        if(typeof(buttons[_('Okay')]) == "function")
          buttons[_('Okay')].call();
      }
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
        $("#attribute-grid").setGridWidth($('#tabs').innerWidth() - 38);
    }).trigger('resize');
    //initial toolbar
    $('#t_attribute-grid').html("<button id='attribute-del'></button><button id='attribute-modify'></button><button id='attribute-add'></button>");
    $('#attribute-add').button({
			text: false,
			icons: {
				primary: 'ui-icon-plus'
			}
		}).click(function(){
      $('#attribute-name').prop('disabled', false); 
      $('#attribute-dialog').dialog('open'); 
    });

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
        dispatch("lasuli.core.doDestroyAttribute", attribute);
      }
      else
      {
        var message = {};
        message.title = _("Warning");
        message.content = _("no.attribute.selected");
        dispatch("lasuli.ui.doShowMessage", message);
      }
		});
		//Modify selected attribute
		$('#attribute-modify').button({
			text: false,
			icons: {
				primary: 'ui-icon-pencil'
			}
		}).click(function(){
		  var gr = $("#attribute-grid").jqGrid('getGridParam','selrow');
      if( gr != null ) { 
        var data = $("#attribute-grid").jqGrid('getRowData',gr);
        $('#attribute-dialog').dialog('open');
        $('#attribute-name').val(data.name);
        $('#attribute-value').val(data.value);

        $('#attribute-name').prop('disabled', true);
      } else {
        var message = {};
        message.title = _("Warning");
        message.content = _("no.attribute.selected");
        dispatch("lasuli.ui.doShowMessage", message);
      }
		});
  },

  //Auto register all observers
  register: function(){
    for(var func in this)
      if(func.substr(0, 2) == "do" && typeof(lasuli.ui[func]) == "function")
        Observers.add("lasuli.ui." + func, lasuli.ui[func], lasuli.ui);
  },
  unregister: function(){
    for(var func in this)
      if(func.substr(0, 2) == "do" && typeof(lasuli.ui[func]) == "function")
        Observers.remove("lasuli.ui." + func, lasuli.ui[func], lasuli.ui);
  },

  doBlockUI : function(){
    $('div#overlay-div').removeClass('hide');
  },

  doUnBlockUI : function(){
    $('div#overlay-div').addClass('hide');
  },

	doAddServerField : function(){
		var str = '<fieldset>';
		str += '<legend>Service Hypertopic</legend>';
		str += '<p><label>URL : <input type="text" class="url" type="url" size="29"/></label></p>';
		str += '<p><label>Utilisateur : <input type="text" class="user" size="25"/></label></p>';
		str += '<p><label>Mot de passe : <input type="password" class="pass" size="23"/></label></p>';
		str += '<div align="right"><button class="delete" type="button">Supprimer</button></div>';
		str += '</fieldset>';
		
		return $(str).insertBefore('#config-toolbar').find('button').button({ icons: { primary: "ui-icon-closthick" }}).parents('fieldset');
	},
	
	doRemoveServerField : function(){
		$(this).parents('fieldset').hide().remove();
	},
	
	doSaveConfiguration : function(){
		var servers = [];
		var defaultServer = false;
		$('#config-panel').find('fieldset').each(function(){
			var server = {};
			server.url = $(this).find('input.url').val();
			server.user = $(this).find('input.user').val();
			server.pass = $(this).find('input.pass').val();
			
			if($(this).attr('id') == 'default-server')
			{
				if(server.url != ''){
					server.default = true;
					defaultServer = true;
					servers.push(server);
				}
			}
			else
				if(server.url != '')
					servers.push(server);
				else
					$(this).remove();
		});
		
		if(!defaultServer)
		{
	    dispatch("lasuli.ui.doShowMessage", {"title": _("Error"), "content": _('options.error.nodefaultserver')});
	    return false;
		}

		Preferences.set("extensions.lasuli.setting",JSON.stringify(servers));
		self.location.reload();
	},
	
	doOpenConfigPanel : function(){
		this.initConfigPanel();
	},
	
  doCloseViewpointPanel : function(viewpointID){
    var logger = Log4Moz.repository.getLogger("lasuli.ui.doCloseViewpointPanel");
    //If the viewpointID is specificed, then only close one viewpoint panel.
    if(viewpointID)
    {
      var el = "div#tabs ul li a[href='#" + viewpointID + "']";
      //logger.trace(el);
      $(el).next('span').click();
    }
    else
    {
      //Close all viewpoint panel
      var el = "div#tabs ul li a.tab-viewpoint";
      $(el).next('span').click();
      //Open the first tab panel
      $tabs.tabs('option', 'selected', 0);
    }
    $('#topic-tree-dialog').dialog('close');
  },

  doShowMessage : function(subject, data){
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

  doShowViewpoints : function(viewpoints){
    var logger = Log4Moz.repository.getLogger("lasuli.ui.doShowViewpoints");
    $('#viewpoints-ul li').hide().remove();
    for(var viewpointID in viewpoints)
      $("#viewpoints-ul").append("<li uri='" + viewpointID + "'><img src='css/blitzer/images/delete.png' class='icon-remove-viewpoint'><a>"
                                   + viewpoints[viewpointID] + "</a></li>");
  },

  doShowAttributes : function(attributes){
    var logger = Log4Moz.repository.getLogger("lasuli.ui.doShowAttributes");
    //logger.trace(attributes);
    $("#attribute-grid").jqGrid('clearGridData');
    if(!attributes) return false;
    var index = 1;
    for(var name in attributes)
      for(var j=0, v; v = attributes[name][j]; j++)
      {
        //logger.trace({"name": name, "value": v});
        $("#attribute-grid").addRowData(index, {"name": name, "value": v});
        index++;
      }
  },

  doShowTagCloud : function(tags){
    var logger = Log4Moz.repository.getLogger("lasuli.ui.doShowTagCloud");
    //logger.trace(tags);
    $("#tags ul li").hide().remove();
    if(!tags) return false;

    var max = 0;
    var min = 32768;
    for(var name in tags)
    {
      if(tags[name].size > max) max = tags[name].size;
      if(tags[name].size < min) min = tags[name].size;
    }
    //var_dump("UI.init.js", "max:" + max + ", min:" + min, 4);
    for(var name in tags)
    {
      var size = Math.round((tags[name].size - min) / (max-min) * 4) + 1;
      //var_dump("UI.init.js", "topics[name].length:" + topics[name].length, 4);
      var content = "<li class='tag" + size + "'><a>" + name + "</a></li>";
      $("#tags ul").append(content);
    }
    $("#tags ul li").tsort({order:"asc"});
    $("#tags ul li a").click(function(){
      var topicName = $(this).text();
      dispatch("lasuli.core.doOpenViewpointByTopicName", topicName);
      return false;
    });
  },

  doClearDocumentPanel : function(){
    var logger = Log4Moz.repository.getLogger("lasuli.ui.doClearDocumentPanel");
    //logger.trace("clear the document panel");
    // Clear the document name
    // $("#h3-entity-name").html(_("no.name"));
    // Clear the attribute grid
    try{
      $("#attribute-grid").jqGrid('clearGridData');
    }catch(e){
      logger.fatal(e);
    }
    // Clear the tag cloud
    try{
      if($("#tags ul li").length > 0) $("#tags ul li").hide().remove();
    }catch(e){
      logger.fatal(e);
    }
  },

  doShowViewpointPanels : function(viewpoints){
    var logger = Log4Moz.repository.getLogger("lasuli.ui.doShowViewpointPanels");
    //logger.trace(viewpoints);
    if(!viewpoints) return false;

    var tabIndex = -1;
    for(var i=0, viewpoint; viewpoint = viewpoints[i]; i++)
    {
      //logger.trace($("div#"+viewpoint.id));
      //If this viewpoint tab is already created.
      if($("div#"+viewpoint.id).length > 0) continue;
      //Create the tab for this viewpoint
      //logger.trace("adding viewpoint:" + viewpoint.id + ", " + viewpoint.name);
      tabIndex = $tabs.tabs('length')-1;
      $tabs.tabs('add', '#' + viewpoint.id, viewpoint.name, tabIndex);
    }

    //Open created tab
    if(tabIndex > 0)
      $tabs.tabs('option', 'selected', tabIndex);
    else
      $("#tabs ul li").each(function(){
        if($(this).find("a").attr("href") == "#" + viewpoints[0].id)
          $(this).find("a").click();
      });
  },


  doClearViewpointPanel : function(viewpointID){
    $("div#" + viewpointID).find("ul.topics-ul li").hide().remove();
    $("div#" + viewpointID).find("div.fragments").hide().remove();
    $("div#" + viewpointID).find("button.cancel").click();
  },

  /**
   * @param keywords map
   */
  doShowKeywords : function(keywords){
    var logger = Log4Moz.repository.getLogger("lasuli.ui.doShowKeywords");
    var html = "";
    var viewpointID = null;
    for (var t of Iterator(keywords)) {
      var topic = t[1];
      if(!viewpointID) viewpointID = topic.viewpointID;
      var el = 'div#' + topic.viewpointID + ' ul.topics-ul li a[uri="' + topic.topicID + '"]';
      //logger.trace(el);
      if($(el).length > 0)
        continue;
      html += '<li class="topic"><input type="checkbox" class="cb-remove-keyword hide"><a uri="' + topic.topicID + '">' + topic.name + '</a></li>';
      //logger.trace(html);
    }
    //logger.trace(viewpointID);
    //logger.trace(html);
    if(viewpointID && $('#' + viewpointID).length > 0)
    {
      //$('#' + viewpointID +' .topics-ul li').remove();
      $('#' + viewpointID).find(".topics-ul").append(html);
    }
  },

  jstree_types : {
      "valid_children" : [ "viewpoint" ],
      "types" : {
        "viewpoint": { "icon" : {  "image" : "css/blitzer/images/viewpoint.png"} },
        "keyword": { "icon" : {  "image" : "css/blitzer/images/topic_tag.png" } },
        "analysis": { "icon" : {  "image" : "css/blitzer/images/topic_analysis.png" } },
        "topic": { "icon" : { "image" : "css/blitzer/images/topic_add.png" } }
      }
  },

  jstree_contextmenu : {
      "items": function(node){
        var viewpointID = node.attr("viewpointID");
        var topicID = node.attr("topicID") || '';
        var topicType = node.attr("rel");
        var name = node.attr("name");
        var arg = {"viewpointID": viewpointID, "topicID": topicID, "topicType": topicType, "name": name, "sourceObj": node};
        var items = {};
        items.ccp = false;
        items.create = false;
        items.rename = false;
        items.remove = false;
        items.tag = {
          "label"             : _("topictree.tag"),
          "action"            : function (obj) { dispatch("lasuli.core.doTagTopicTreeItem", arg); },
          "separator_after"   : true,
          "icon"              : "css/blitzer/images/menu_tag.png"
        };
        items.untag = {
          "label"             : _("topictree.untag"),
          "action"            : function (obj) { dispatch("lasuli.core.doUnTagTopicTreeItem", arg); },
          "separator_after"   : true,
          "icon"              : "css/blitzer/images/menu_untag.png"
        };
        items.add = {
          "label"             : _("topictree.create"),
          "action"            : function (obj) { dispatch("lasuli.core.doCreateTopicTreeItem", arg); },
          "icon"              : "css/blitzer/images/menu_add.png"
        };
        items.edit = {
          "label"             : _("topictree.rename"),
          "action"            : function (obj) { this.rename(arg.sourceObj); },
          "icon"              : "css/blitzer/images/menu_edit.png"
        };
        items.destroy = {
          "label"             : _("topictree.destroy"),
          "action"            : function (obj) { dispatch("lasuli.core.doDestroyTopicTreeItem", arg); },
          "icon"              : "css/blitzer/images/menu_delete.png"
        };
        switch(topicType) {
          case "viewpoint":
            delete items.tag;
            delete items.untag;
            delete items.destroy;
            items.edit.label = _('topictree.viewpoint.rename');
            return items;
          case "analysis":
            delete items.tag;
            delete items.untag;
            return items;
          case "keyword":
            delete items.tag;
            return items;
          case "topic":
            delete items.untag;
            return items;
        }
      }
  },
  
  jstree_dnd : {
    "drop_check": function(data){
      var logger = Log4Moz.repository.getLogger("lasuli.ui.jstree_dnd.drop_target");
      logger.debug(data);
    }
  },
  
  jstree_crrm : {
    "move" : {
      /*"check_move" : function (m) {
        var logger = Log4Moz.repository.getLogger("lasuli.ui.jstree_crrm.move.check_move");
        var p = this._get_parent(m.o);
        logger.debug(m.o.attr('topicID'));
        logger.debug(m.o.attr('name'));
        logger.debug(m.np.attr('topicID'));
        logger.debug(m.np.attr('name'));
      }*/
    }
  },
  jstree_move : function (e, data) {
    data.rslt.o.each(function (i) {
      var logger = Log4Moz.repository.getLogger("lasuli.ui.jstree_move");
      logger.debug($(this).attr("viewpointID"));
      logger.debug($(this).attr("topicID"));
      logger.debug($(this).attr("name"));
      logger.debug($(this).attr("rel"));
      logger.debug(data.rslt.np.attr("topicID"));
      logger.debug(data.rslt.np.attr("name"));
      logger.debug(data.rslt.np.attr("rel"));
      
      if($(this).attr("rel") == 'viewpoint'){
        $.jstree.rollback(data.rlbk);
        return false;
      }
        
      var arg = {
        "viewpointID": $(this).attr("viewpointID"), 
        "topicID": $(this).attr("topicID"), 
        "broaderTopicID": data.rslt.np.attr("topicID"), 
        "rlbk": data.rlbk,
        "rslt": data.rslt};
      dispatch("lasuli.core.doMoveTopicTreeItem", arg);
      //$.jstree.rollback(data.rlbk);
      //data.inst.refresh(data.inst._get_parent(data.rslt.oc));
    });
  },
  
  doShowTopicTree : function(topics){
    $.jstree._themes = 'chrome://lasuli/content/css/jsTree/themes/';
    $("#tree").jstree({
      "json_data" : topics,
      "types" : lasuli.ui.jstree_types,
      "contextmenu": lasuli.ui.jstree_contextmenu,
      "dnd" : lasuli.ui.jstree_dnd,
      "crrm" : lasuli.ui.jstree_crrm,
      "plugins" : [ "themes", "json_data", "ui", "crrm", "dnd", "contextmenu", "types", "sort" ]
    }).bind("rename.jstree", function (e, data) {
      var logger = Log4Moz.repository.getLogger("lasuli.ui.rename");
      var sourceObj   = data.rslt.obj;
      var viewpointID = sourceObj.attr('viewpointID');
      //logger.trace(viewpointID);
      var topicID     = sourceObj.attr('topicID') || '';
      //logger.trace(topicID);
      var topicType   = sourceObj.attr('rel');
      var name        = data.rslt.old_name;
      var newName     = data.rslt.new_name;
      //logger.trace(newName);
      var arg = {"viewpointID": viewpointID, "topicID": topicID, "topicType": topicType, "name": name, "newName": newName, "sourceObj": sourceObj};

      dispatch("lasuli.core.doRenameTopicTreeItem", arg);
    }).bind("move_node.jstree", lasuli.ui.jstree_move);
  },
  doRefreshTopicTree: function(data){
    data.inst.refresh(data.inst._get_parent(data.rslt.oc));
  },
  doRollbackTopicTree: function(data){
    $.jstree.rollback(data.rlbk);
  },
  doReloadTopicTree: function(topics){
    var logger = Log4Moz.repository.getLogger("lasuli.ui.doReloadTopicTree");
    //logger.trace(topics);
    //$("#tree").jstree({"json_data" : topics}).jstree('refresh', -1);
    $("#tree").jstree('destroy');
    //Sync.sleep(1000);
    dispatch("lasuli.ui.doShowTopicTree", topics);
  },
  doCreateTopicTreeItem : function(arg){
    var logger = Log4Moz.repository.getLogger("lasuli.ui.doCreateTopicTreeItem");
    $("#tree").jstree("create", arg.sourceObj, "inside", {"data": _("no.name"), "attr": {"viewpointID": arg.viewpointID, "topicID": arg.topicID, "rel": "topic"}}, null, true);
  },
  doDestroyTopicTreeItem : function(arg){
    var logger = Log4Moz.repository.getLogger("lasuli.ui.doDestroyTopicTreeItem");
    $("#tree").jstree("remove", arg.sourceObj);
  },

  doRenameViewpoint : function(viewpointID, name){
    $('div#tabs li a[href="#' + viewpointID + '"]').html(name);
  },

  doRenameTopicTreeItem : function(arg){
    var node = arg.sourceObj;
    if(arg.name)
    {
      node.attr("name", arg.name);
    }
  },

  doUpdateTopicTreeMenuItem : function(arg){
    var node = arg.sourceObj;
    if(arg.rel)
    {
      node.attr("rel", arg.rel);
    }
  },
  doDestroyKeyword : function(keyword){
    var logger = Log4Moz.repository.getLogger("lasuli.ui.doDestroyKeyword");
    //logger.trace('div#' + tag.viewpointID + ' ul.topics-ul li a[uri="' + tag.topicID + '"]');
    var el = 'div#' + keyword.viewpointID + ' ul.topics-ul li a[uri="' + keyword.topicID + '"]';
    if($(el).length > 0)
      $(el).parent().remove();
  },

  doRestoreKeyword : function(keyword){
    //$('ul.topics-ul img.remove-tag-img').addClass('hide');
    $('ul.topics-ul').find('input.edit-in-place').replaceWith("<a uri='" + keyword.topicID + "'>" + keyword.name + "</a>");
  },

  _initFragmentsContainer : function(topic){
    var logger = Log4Moz.repository.getLogger("lasuli.ui._initFragmentsContainer");
    if(!topic.color) topic.color = getColor(topic.topicID);
    var html = '<div class="fragments ui-widget" viewpointID="' + topic.viewpointID + '" topicID="' + topic.topicID + '">'
       +'<div class="fragment-header" viewpointID="' + topic.viewpointID + '" topicID="' + topic.topicID + '">'
       +'<img class="fragment-toggle" src="css/blitzer/images/toggle-close.png">'
       +'<span class="ui-corner-right" style="background-color:'+ alpha(topic.color) + '">'
       + topic.name + '</span></div><ul>'
       + '</ul></div>';
    $('div#' + topic.viewpointID).find(".fragments-container").append(html);
  },

  doCreateFragments : function(arg){
    var logger = Log4Moz.repository.getLogger("lasuli.ui.doCreateFragments");
    //logger.trace(arg);
    var fragments = arg.fragments;
    for(var fragmentID in fragments)
    {
      fragment = fragments[fragmentID];
      var coordinates = fragment.getCoordinates();
      var startPos = coordinates[0][0];
      var viewpointID = fragment.topic.getViewpointID();
      var topicID = fragment.topic.getID();
      var text = fragment.getText();
      var li_html = '<li class="fragment ui-corner-bottom" viewpointID="' + viewpointID + '" topicID="' + topicID + '" fragmentID="' + fragmentID + '" startPos="' + startPos + '" >'
             +'<span class="ui-icon ui-icon-arrowthick-2-n-s"></span>'
             +'<em class="fragment-text">' + text + '</em></li>';
      //logger.trace(li_html);
      var el = "div.fragments[viewpointID='" + viewpointID + "'][topicID='" + topicID + "']";
      //logger.trace(el);
      if($(el).length > 0)
        $(el).find("ul").append(li_html);
    }

    $("div.fragments ul li").tsort({order:"asc",attr:"startPos"});
    dispatch("lasuli.ui.doMakeFragmentsDragable", null);
  },
  /**
   * @param arg map of topics (map), fragments (map), and scroll (boolean)
   */
  doShowFragments : function(arg){
    var logger = Log4Moz.repository.getLogger("lasuli.ui.doShowFragments");
    //logger.trace(arg);
    var topics = arg.topics;
    for (var topic of Iterator(topics)) {
      lasuli.ui._initFragmentsContainer(topic[1]);
    }
    dispatch("lasuli.ui.doMakeFragmentsDroppable", null);
    //logger.trace(arg.fragments);
    dispatch("lasuli.ui.doCreateFragments", {"fragments": arg.fragments, "highlight": true} );
  },

  doMakeFragmentsDragable : function(){
    $(".fragment").draggable(
      {
        connectToSortable: '.fragments ul',
        cursor: 'move',
        helper: 'clone',
        revert: 'invalid'
      });
  },

  doMakeFragmentsDroppable : function(){
    var logger = Log4Moz.repository.getLogger("lasuli.ui.doMakeFragmentsDroppable");
    //logger.trace('doMakeFragmentsDroppable');
    $(".fragments").droppable({
      accept: '.fragment',
      drop: function(event, ui)
      {
        var logger = Log4Moz.repository.getLogger("lasuli.ui.doMakeFragmentsDroppable.drop");
        //logger.trace($(this).html());
        var li_element = ui.draggable;
        var ul_element = ui.draggable.parent();
        //logger.trace(ul_element.prev("div").attr("class"));
        var sourceTopicID = ul_element.prev("div").attr("topicID");
        var targetTopicID = $(this).attr("topicID");
        var fragmentID = li_element.attr("fragmentID");
        var viewpointID = li_element.attr("viewpointID");

        //logger.trace("sourceTopicID:" + sourceTopicID + ", targetTopicID:" + targetTopicID + ",fragmentID:" + fragmentID);

        if(targetTopicID == sourceTopicID)
        {
          ui.helper.fadeOut();
          return;
        }
        dispatch("lasuli.core.doMoveFragment", {"fragmentID": fragmentID, "sourceTopicID": sourceTopicID, "targetTopicID": targetTopicID, "helper": ui.helper,
          "viewpointID": viewpointID} );
      }
    });
  },

  doDropFragmentAccepted : function(arg){
    var logger = Log4Moz.repository.getLogger("lasuli.ui.doDropFragmentAccepted");
    //logger.trace(arg);
    var viewpointID = $('li[fragmentID="' + arg.fragmentID + '"]').attr("viewpointID");
    //logger.trace(viewpointID);

    var el = "div.fragments[viewpointID='" + viewpointID + "'][topicID='" + arg.targetTopicID + "'] ul";
    //logger.trace(el);
    $('li[fragmentID="' + arg.fragmentID + '"]').clone().appendTo($(el)).attr("topicID", arg.targetTopicID);
    //logger.trace($('li[fragmentID="' + arg.fragmentID + '"][topicID="' + arg.sourceTopicID + '"]').html());
    $('li[fragmentID="' + arg.fragmentID + '"][topicID="' + arg.sourceTopicID + '"]').hide().remove();
    //logger.trace("old fragment hide");
    $('li.ui-draggable-dragging[fragmentID="' + arg.fragmentID + '"]').hide().remove();
    //logger.trace("sort fragments");
    $("div.fragments ul li").tsort({order:"asc",attr:"startPos"});
    dispatch("lasuli.ui.doMakeFragmentsDragable", null);
  },

  doDropFragmentDenied : function(arg){
    arg.helper.fadeOut();
  },

  doRemoveFragment : function(fragmentID) {
    var logger = Log4Moz.repository.getLogger("lasuli.ui.doRemoveFragment");
    var el = "li.fragment[fragmentID='" + fragmentID + "']";
    //logger.trace(el);
    $(el).slideToggle({duration: 500, easing: 'easeInSine'}).remove();
  },


  doCreateAnalysis: function(topic){
    lasuli.ui._initFragmentsContainer(topic);
    dispatch("lasuli.ui.doMakeFragmentsDragable", null);
    dispatch("lasuli.ui.doMakeFragmentsDroppable", null);
    var el = "div.fragment-header[viewpointID='" + topic.viewpointID + "'][topicID='" + topic.topicID + "']";
    var span = $(el).find("span");
    span[0].scrollIntoView(true);
    span.fadeOut(500).fadeIn(500).fadeOut(500).fadeIn(500).fadeOut(500).fadeIn(500);
  },

  doRenameAnalysis : function(arg){
    var logger = Log4Moz.repository.getLogger("lasuli.ui.doRenameAnalysis");
    //logger.trace(arg);
    var el="div.fragment-header[viewpointID='" + arg.viewpointID + "'][topicID='" + arg.topicID + "']";
    var span = $(el).find("span");
    span.html(arg.name);
  },

  doRestoreAnalysis : function(arg){
    var logger = Log4Moz.repository.getLogger("lasuli.ui.doRestoreAnalysis");
    //logger.trace(arg);

    var viewpointID = arg.viewpointID;
    var topicID = arg.topicID;
    var originalImage = arg.originalImage;
    var originalSpan = arg.originalSpan;
    originalSpan.text(arg.name);
    var el="div.fragment-header[viewpointID='" + viewpointID + "'][topicID='" + topicID + "']";
    $(el).find('img.fragment-toggle').attr("src", originalImage);
    $(el).find('input').replaceWith(originalSpan);
  },

  doDestroyAnalysis : function(arg){
    var logger = Log4Moz.repository.getLogger("lasuli.ui.doDestroyAnalysis");
    //logger.trace(arg);

    var viewpointID = arg.viewpointID;
    var topicID = arg.topicID;
    var el="div.fragments[viewpointID='" + viewpointID + "'][topicID='" + topicID + "']";
    $(el).slideToggle({duration: 500, easing: 'easeInSine'}).remove();
  },

  doHighlightMenuClick: function(topicBase64Encoded){
    var logger = Log4Moz.repository.getLogger("lasuli.ui.doHighlightMenuClick");
    try{ topic = JSON.parse(Base64.decode(topicBase64Encoded)); }catch(e){}
    logger.debug(topic);
    var wm = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);
    var win = wm.getMostRecentWindow("navigator:browser");
    var content = win.getBrowser().contentWindow;
    var selection = content.getSelection();
    //logger.debug("selection:" + selection);
    var strContent = selection + "";
    strContent = strContent.trim();
    if(strContent == ""){
      //TODO replace with message in lasuli
      alert(_("null.content.selected"));
      return false;
    }
    var range = selection.getRangeAt(0);
    var startContainer = range.startContainer;
    var endContainer = range.endContainer;
    var startOffset = range.startOffset;
    var endOffset = range.endOffset;

    var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
                   .getService(Components.interfaces.nsIWindowMediator);
    var win = wm.getMostRecentWindow("navigator:browser");
    var contentDocument = win.getBrowser().contentDocument;
    var treewalker;
    //logger.debug('start to get treewalker');
    try{
      treewalker = contentDocument.createTreeWalker(contentDocument.body,
      NodeFilter.SHOW_TEXT,
      { acceptNode: function(node)
        {
          // only get text content
          if(node.nodeType != 3 || node.data.length == 0)
            return NodeFilter.FILTER_REJECT;

          // Filter the <script> content
          var m_parent = node.parentNode;
          if(m_parent && m_parent.tagName == "SCRIPT")
            return NodeFilter.FILTER_REJECT;

          return NodeFilter.FILTER_ACCEPT;
        }
      },
      false);
    }catch(e){
      logger.fatal(e);
      return false;
    }
    //logger.debug('start to get position');
    var curPos = 0;
    var startPos,endPos;
    //logger.debug(startContainer.data);
    //logger.debug(typeof(endContainer));
    //logger.debug(endContainer.tagName);
    //logger.debug(endContainer.textContent);
    //logger.debug(startContainer===endContainer);
    while(treewalker.nextNode())
    {
        var node = treewalker.currentNode;
        //logger.debug(node.textContent);

        if(node===startContainer){
          startPos = curPos + startOffset;
          //logger.debug("start:" + startPos);
          //logger.debug("strContent.length:" + strContent.length);
          endPos = startPos + ('' + range).length;
          //logger.debug("endPos:" + endPos);
          break;
        }
        //logger.debug("in loop startPos:" + startPos + ", endPost:" + endPos);
        curPos += node.data.length;
    }
    //logger.debug("startPos:" + startPos + ", endPost:" + endPos);
    if(typeof startPos != "number" || typeof endPos != "number") return false;
    //logger.debug(strContent);
    var viewpointID;
    if(topic.viewpointID)
      viewpointID = topic.viewpointID;
    else
      viewpointID = $('div#tabs li.ui-tabs-selected a').attr('href').substr(1);

    var topicID = (topic.topicID) ? topic.topicID : null;
    var fragment = { "viewpointID": viewpointID, "topicID": topicID, "startPos": startPos, "endPos": endPos, "text": strContent };
    //logger.debug(fragment);
    dispatch("lasuli.core.doCreateFragment", fragment);
  },

  doUpdateProgressBar: function(arg){
    var logger = Log4Moz.repository.getLogger("lasuli.ui.doUpdateProgressBar");
    var t,v;
    if(typeof(arg) == "object")
    {
      t = arg[1];
      v = arg[0];
      v = (v/t) * 100;
    }
    else
    {
      t = 100;
      v = arg;
    }
    if(v < 100)
    {
      $('div#overlay-div').removeClass('hide').css("opacity", 0.2);
      $('div#progressbar').show().progressbar({ value: v });
    }
    else
    {
      $('div#overlay-div').addClass('hide').css("opacity", 0.5);
      $('div#progressbar').hide().progressbar('destroy');
    }
  }
}

$(window).bind("load", function(){
  var logger = Log4Moz.repository.getLogger("lasuli.ui.load");
  lasuli.jqGirdLoader();
  lasuli.ui.register();
  lasuli.ui.doBlockUI();
  lasuli.ui.initTabs();
  lasuli.ui.initViewpointPanel();
  lasuli.ui.initPlusPanel();
  lasuli.ui.initAttributeGrid();
  dispatch('lasuli.sidebar.onSidebarOpened', null);
  //wait until all event listener registered
  Sync.sleep(500);
  
  try{ lasuli.ui.initDocumentPanel(); }catch(e){ logger.fatal(e); }
});

$(window).bind("unload", function(){
  lasuli.ui.unregister();
  dispatch('lasuli.core.doClearFragmentsCache', null);
  dispatch('lasuli.contextmenu.doHide', null);
  dispatch('lasuli.highlighter.doClear', null);
  dispatch('lasuli.sidebar.onSidebarClosed', null);

});
