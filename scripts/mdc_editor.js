
  //const DOMAIN = "https://findemor.github.io/microservices-design-canvas-frame/";
  //const HOST = location.protocol+'//'+location.hostname+(location.port ? ':'+location.port: '');
  //const DOMAIN = window.location.href;
  //const DOMAIN = "http://localhost/";

(function( $ ) {
 
    $.fn.mdc_editor = function(options) {
      let settings = $.extend({
        domain: location.protocol+'//'+location.hostname+(location.port ? ':'+location.port: ''),
        json: null,
        url: null,
      }, options );

    const template = {
      "mdcf": "1.0.0",
      "id": "",
      "url": "",
      "name": "",
      "description": "",
      "capabilities": [ ],
      "implementation": {
        "qualities": [],
        "logic": [],
        "data": []
      },
      "dependencies": {
        "serviceDependencies": [],
        "eventsSubscriptions": []
      },
      "interface": {
        "queries": [],
        "commands": [],
        "eventsPublished": []
      }
    };
    
    let editor = null;

    //get json schema
    $.getJSON(getUrl("specs/schema.json"), (schema) => { 
      setEditor("jsonInput", template, schema);

      //configure buttons
      setupFileButtons(schema);
      setupShareButtons();
      setupDownloadButton();

      //initialize from params
      if (settings.url) {
        onURLInput(settings.url, schema);
      } else if (settings.json) {
        onJSONInput(settings.json, schema);
        editor.set(settings.json);
      }
    });

    function setupDownloadButton() {
      $( "#downloadBtn" ).click(() => {
        download();
      });
    }

    
    /// download this json file
    function download() {

      let parent = $("#downloadBtnPlaceholder");
      let filename = "mdc_spec.json";
      let json = JSON.stringify(editor.get(), null, 4);
      let element = document.createElement('a');
      element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(json));
      element.setAttribute('download', filename);
    
      element.style.display = 'none';
      $(parent).append(element);
    
      element.click();
    
      $(parent).remove(element);
    }
    
    /**
     * When Url changes...
     */
    function onURLInput(url, schema) {   

      $.getJSON(url)
      .done((json) => { 
        editor.set(json);

        let error = validateJson({ json, url, schema });
        if (!error) {
          showError({});
          printCanvas({ url });

          let base64json = window.btoa(JSON.stringify(json));
          setupShareModal({ base64json, url });
        } else {
          showError(error);
        }

      })
      .fail((jqXHR, textStatus, errorThrown) => { 
        showError({ desc: "Invalid MDC Json URL", message: textStatus });
      })
      //.always(function() { console.log('getJSON request ended!'); });
    }

    /**
     * When json changes...
     */
    function onJSONInput(json, schema) {
      if ($.type(json) === "string") json = JSON.parse(json);
      let error = validateJson({ json, schema });

      if (!error) {
        showError({});
        let base64json = window.btoa(JSON.stringify(json));
        printCanvas({ base64json });
        setupShareModal({ base64json, url });
      } else {
        showError(error);
      }
    }

    
    //evaluate and print canvas
    function validateJson({ json, schema }) {
      let error = null;
      try {
        let validation = tv4.validateResult(json, schema);
        if (!validation.valid && json) {
          throw Error(validation.error.message);
        }
      } catch (message) {
        error = { desc: "There are some Json validation errors", message };
      } finally {
        return error;
      }
    }

    //print canvas from data
    function printCanvas({ base64json, url }) {      
      let absoluteUrl = "html/iframe.html";
      
      if (base64json) absoluteUrl = getUrl("html/iframe.html?base64json=" + base64json);
      else if (url) absoluteUrl = getUrl("html/iframe.html?url=" + encodeURIComponent(url));

      $( "#mdc_iframe" ).attr('src', absoluteUrl);
    }


    /**
     * sets sharing fields from input data
     */
    function setupShareModal({ url, base64json }) {
      //Preparamos la caja de compartir
      if (base64json) {
        let absoluteUrl = getUrl("html/iframe.html?base64json=" + base64json);

        //iframe
        $( "#shareEmbed" ).val(`<iframe src="${absoluteUrl}"></iframe>`);
        $( "#CopyShareEmbed" ).prop('disabled', false);
        //link
        $( "#shareLinkEmbed" ).val(absoluteUrl);
        $( "#CopyShareLinkEmbed" ).prop('disabled', false);
      } else {
        $( "#CopyShareEmbed" ).prop('disabled', true);
        $( "#CopyShareLinkEmbed" ).prop('disabled', true);
      }

      if (url) {
        let absoluteUrl = getUrl("html/iframe.html?url=" + encodeURIComponent(url));

        //iframe
        $( "#shareURL" ).val(`<iframe src="${absoluteUrl}"></iframe>`);
        $( "#CopyShareURL" ).prop('disabled', false);
        //link
        $( "#shareLinkURL" ).val(absoluteUrl);
        $( "#CopyShareLinkURL" ).prop('disabled', false);
      } else {
        $( "#CopyShareURL" ).prop('disabled', true);
        $( "#CopyShareLinkURL" ).prop('disabled', true);
      }
    }

    /**
     * sets the buttons related to import from file url behaviour
     */
    function setupFileButtons(schema) {
      $("#reloadUrl").click(() => {
        onURLInput($("#urlInput").val(), schema);
      });

      $("#loadExample").click(() => {
        let url = getUrl("specs/example.json");
        $("#urlInput").val(url);
        onURLInput(url, schema);
      });

      $("#onURLInput").click(() => {
        onURLInput($("#urlInput").val(), schema);
      });
    }

    /**
     * sets the buttons related to sharing functionality
     */
    function setupShareButtons() {
      $( "#CopyShareEmbed" ).click(() => {
        $( "#shareEmbed" ).select();
        document.execCommand("copy");
      });

      $( "#CopyShareURL" ).click(() => {
        $( "#shareURL" ).select();
        document.execCommand("copy");
      });

      $( "#CopyShareLinkEmbed" ).click(() => {
        $( "#shareLinkEmbed" ).select();
        document.execCommand("copy");
      });

      $( "#CopyShareLinkURL" ).click(() => {
        $( "#shareLinkURL" ).select();
        document.execCommand("copy");
      });
    }

    //show error helper
    function showError({ desc, message }) {
      if (desc && message) {
        $( "#error").show({});
        $( "#error-desc").text(desc);
        $( "#error-message").text(message);
      } else {
        $( "#error").hide();
      }
    }

    /**
     * Setting up the Json Editor
     * https://github.com/josdejong/jsoneditor/blob/master/docs/api.md
     */
    function setEditor(elementId, template, schema) {
      // create the editor
      const container = document.getElementById(elementId);
      const options = {
        onChangeJSON: (json) => {
          onJSONInput(json, schema)
        }
      };
      editor = new JSONEditor(container, options);
      editor.set(template);
    }

    /**
     * Build the absolute Url from rel
     */
    function getUrl(page) {
      return settings.domain + page;
    }

    //for chaining
    return this;
  };

}( jQuery ));
