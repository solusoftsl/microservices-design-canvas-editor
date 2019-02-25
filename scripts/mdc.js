//https://learn.jquery.com/plugins/basic-plugin-creation/
(function( $ ) {
 
  $.fn.mdc = function(options) {
    let settings = $.extend({
      url: null,
      json: null,
    }, options );

    
    //get json spec
    if (settings.json) {
      processContent({ container: this, json: settings.json });
    } else if (settings.url) {
      $.getJSON(settings.url, ( data ) => {
        processContent({ container: this, json: data });  
      });
    } else {
      console.log("options url or json must be specified");
    }

    //process content
    function processContent({ container, json }) {
      let link = null;
      if (json.url) {
        link = `<a target="_blank" href="${json.url}"><img src="https://www.google.com/s2/favicons?domain=${json.url}" title="Link to Microservice's website"/></a>`;
        container.find("#link").html(link);
      }
      container.find("#name").text(json.name);
      container.find("#description").text(json.description);
      printList({ ul: container.find("#capabilities"), array: json.capabilities });
      printList({ ul: container.find("#implementation_qualities"), array: json.implementation.qualities });
      printList({ ul: container.find("#implementation_logic"), array: json.implementation.logic });
      printList({ ul: container.find("#implementation_data"), array: json.implementation.data });
      printList({ ul: container.find("#dependencies_servicesDependencies"), array: json.dependencies.serviceDependencies });
      printList({ ul: container.find("#dependencies_eventsSubscriptions"), array: json.dependencies.eventsSubscriptions });
      printList({ ul: container.find("#interface_queries"), array: json.interface.queries });
      printList({ ul: container.find("#interface_commands"), array: json.interface.commands });
      printList({ ul: container.find("#interface_eventsPublished"), array: json.interface.eventsPublished });
    }   

    function printList({ ul, array }) {
      if (!array || array.length == 0) {
        $(`<li>(none)</li>`).addClass("value").appendTo(ul);
      } else {
        $.each(array, function(index, item) {

          if ($.type(item) === "string") {
            //es un tipo simple
            $(`<li>${item}</li>`).addClass("value").appendTo(ul);
          } else {
            //es un tipo bloque
            let nLI = $(`<li>${item.title}</li>`).addClass("value").appendTo(ul);
            let nUL = $(`<ul></ul>`).addClass("values").addClass("nested").appendTo(nLI);
            $.each(item.list, function(i, listItem) {
              $(`<li>${listItem}</li>`).addClass("value").appendTo(nUL);
            });
          }

        });
      }
    }
 
    //chaining
    return this;
  };

}( jQuery ));

//favicons https://www.google.com/s2/favicons?domain=https://www.solusoft.es