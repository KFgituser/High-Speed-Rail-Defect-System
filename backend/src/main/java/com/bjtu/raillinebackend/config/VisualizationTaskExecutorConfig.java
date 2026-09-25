package com.bjtu.raillinebackend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

@Configuration
@EnableScheduling
public class VisualizationTaskExecutorConfig {
    @Bean(name = "visualizationTaskExecutor")
    public ThreadPoolTaskExecutor visualizationTaskExecutor(
            @Value("${app.visualization.max-concurrent-tasks:2}") int maxConcurrentTasks,
            @Value("${app.visualization.queue-capacity:8}") int queueCapacity) {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(maxConcurrentTasks);
        executor.setMaxPoolSize(maxConcurrentTasks);
        executor.setQueueCapacity(queueCapacity);
        executor.setThreadNamePrefix("visualization-");
        executor.setWaitForTasksToCompleteOnShutdown(false);
        return executor;
    }
}
