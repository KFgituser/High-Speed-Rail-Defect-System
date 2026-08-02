package com.bjtu.raillinebackend.config;



import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;


@Configuration
public class WebConfig implements WebMvcConfigurer {

    // application.yml 里配置的绝对路径，例如 D:/JH_Codebase/out 或 D:/JH_Codebase
    @Value("${viz.outDir}")
    private String outDir;
    @Value("${viz.outDir}")
    private String outRoot;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // 1) 把 /viz-out/** 映射到 outDir 本地目录
        //    注意要加 "file:" 前缀；Windows 路径要用正斜杠或转义反斜杠
        String loc = outDir.endsWith("/") ? outDir : outDir + "/";
        String fileRoot = Path.of(outRoot).toUri().toString();
        registry.addResourceHandler("/viz-out/**")
                .addResourceLocations("file:" + loc);


    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        // 2) CORS：前端域名/端口按你的实际填写
        registry.addMapping("/api/**")
                .allowedOrigins("http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5173")
                .allowedMethods("GET","POST","OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
        // /viz-out/** 是静态资源，通常不需要额外 CORS；如需跨域访问也可单独放开：
        // registry.addMapping("/viz-out/**").allowedOrigins(...).allowedMethods("GET");
    }


}
