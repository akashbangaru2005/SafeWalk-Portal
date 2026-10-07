package com.safewalk.config;

import java.nio.file.Paths;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class UploadConfig implements WebMvcConfigurer {

    @Value("${safewalk.upload-dir:uploads}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(
            ResourceHandlerRegistry registry
    ) {

        String location =
                Paths.get(uploadDir)
                        .toAbsolutePath()
                        .normalize()
                        .toUri()
                        .toString();

        registry
                .addResourceHandler("/uploads/**")
                .addResourceLocations(location);
    }
}