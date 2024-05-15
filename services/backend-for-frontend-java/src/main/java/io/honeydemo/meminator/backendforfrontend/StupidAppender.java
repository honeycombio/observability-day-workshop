package io.honeydemo.meminator.backendforfrontend;

import org.apache.logging.log4j.core.appender.AbstractAppender;
import org.apache.logging.log4j.core.config.plugins.Plugin;
import org.apache.logging.log4j.core.config.plugins.PluginAttribute;
import org.apache.logging.log4j.core.config.plugins.PluginElement;
import org.apache.logging.log4j.core.config.plugins.PluginFactory;
import org.apache.logging.log4j.core.Core;
import org.apache.logging.log4j.core.LogEvent;
import org.apache.logging.log4j.core.Appender;
import org.apache.logging.log4j.core.Filter;


@Plugin(
  name = "StupidAppender", 
  category = Core.CATEGORY_NAME, 
  elementType = Appender.ELEMENT_TYPE)
public class StupidAppender extends AbstractAppender {


    protected StupidAppender(String name, Filter filter) {
        super(name, filter, null, true, null);
    }

    @PluginFactory
    public static StupidAppender createAppender(
      @PluginAttribute("name") String name, 
      @PluginElement("Filter") Filter filter) {
        return new StupidAppender(name, filter);
    }

    @Override
    public void append(LogEvent event) {
       System.out.println("Here is a stupid log event: " + event.toString());
    }
}