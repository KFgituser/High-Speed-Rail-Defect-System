package com.bjtu.raillinebackend.config;


import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.CacheControl;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

/*
*  负责“资源映射、MVC 行为、CORS 映射”等。“怎么把资源/API 对外映射提供 + 提供 CORS 映射规则（MVC 层）”
* */

@Configuration  //配置类
public class WebConfig implements WebMvcConfigurer {    //要自定义 Spring MVC 的行为（资源处理、CORS 等）

    // 2D/通用输出（如果你还需要 /viz-out/**）
    @Value("${viz.outDir}")
    private String vizOutDir;

    // 3D 输出根目录：D:/JH_Codebase王舒伦/output/3Doutput
    @Value("${viz3d.base-out-dir}")
    private String viz3dBaseOutDir;

    // 3Damp 输出  生成的图片放在D:/.../output/3Dampoutput/slot1/image3D_amp.png
    @Value("${viz3damp.base-out-dir}")
    private String viz3dampBaseOutDir;


    // 把“文件夹”暴露成“URL 路径”
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {

        // /viz-out/** -> viz.outDir
        registry.addResourceHandler("/viz-out/**")
                .addResourceLocations(toDirUri(vizOutDir))
                .setCacheControl(CacheControl.noStore());

        //  /viz3d-out/** -> viz3d.base-out-dir
        registry.addResourceHandler("/viz3d-out/**")
                .addResourceLocations(toDirUri(viz3dBaseOutDir))
                .setCacheControl(CacheControl.noStore());
        // /viz3damp-out/** -> viz3damp.base-out-dir
        //这样就能通 http://localhost:8080/viz3damp-out/slot1/image3D_amp.png 访问到。
        registry.addResourceHandler("/viz3damp-out/**")
                .addResourceLocations(toDirUri(viz3dampBaseOutDir))
                .setCacheControl(CacheControl.noStore());

    }


    //把 Windows 路径变成 Spring 能识别的 file:// URL
    private String toDirUri(String p) {
        Path path = Paths.get(p).toAbsolutePath().normalize();
        String uri = path.toUri().toString();       // 例：file:///D:/JH_Codebase王舒伦/output/3Doutput
        return uri.endsWith("/") ? uri : (uri + "/");
    }

    //MVC 层的跨域配置
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        // API 跨域
        registry.addMapping("/api/**")
                .allowedOrigins("http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5173")
                .allowedMethods("GET","POST","PUT","DELETE","OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);

        // viz3d-out跨域 静态图片跨域
        registry.addMapping("/viz3d-out/**")
                .allowedOrigins("http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5173")
                .allowedMethods("GET")
                .allowedHeaders("*");
    }
}
