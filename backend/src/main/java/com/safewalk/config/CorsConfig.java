package com.safewalk.config;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.*;
@Configuration
public class CorsConfig implements WebMvcConfigurer {
  @Override public void addCorsMappings(CorsRegistry r){
    r.addMapping("/**").allowedOrigins("http://localhost:5173","https://safe-walk-portal.vercel.app")
      .allowedMethods("GET","POST","PUT","PATCH","DELETE","OPTIONS").allowedHeaders("*")
      .allowCredentials(true).maxAge(3600);
  }
}
