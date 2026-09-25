package com.bjtu.raillinebackend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.CacheControl;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Value("${viz.outDir}")
    private String vizOutDir;

    @Value("${viz3d.base-out-dir}")
    private String viz3dBaseOutDir;

    @Value("${viz3damp.base-out-dir}")
    private String viz3dampBaseOutDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/viz-out/**")
                .addResourceLocations(toDirUri(vizOutDir))
                .setCacheControl(CacheControl.noStore());
        registry.addResourceHandler("/viz3d-out/**")
                .addResourceLocations(toDirUri(viz3dBaseOutDir))
                .setCacheControl(CacheControl.noStore());
        registry.addResourceHandler("/viz3damp-out/**")
                .addResourceLocations(toDirUri(viz3dampBaseOutDir))
                .setCacheControl(CacheControl.noStore());
    }

    private String toDirUri(String directory) {
        Path path = Paths.get(directory).toAbsolutePath().normalize();
        String uri = path.toUri().toString();
        return uri.endsWith("/") ? uri : uri + "/";
    }
}
