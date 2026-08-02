package com.bjtu.raillinebackend.viz;

import org.springframework.stereotype.Component;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.TimeUnit;

@Component
public class PythonRunner {

    /** 用于把 exitCode 和 控制台日志 一起带回 */
    public static class Result {
        public final int exitCode;
        public final String log;
        public Result(int exitCode, String log) {
            this.exitCode = exitCode;
            this.log = log;
        }
    }

    /** 执行 python 脚本，返回 Result（包含退出码和标准输出/错误合并日志） */
    public Result run(String pythonExe, String script, File workDir,
                      Map<String, String> env, List<String> args, long timeoutMs)
            throws IOException, InterruptedException {

        List<String> cmd = new ArrayList<>();
        cmd.add(pythonExe);
        cmd.add(script);
        if (args != null) cmd.addAll(args);

        ProcessBuilder pb = new ProcessBuilder(cmd);
        if (workDir != null) pb.directory(workDir);
        Map<String, String> e = pb.environment();
        if (env != null) e.putAll(env);
        pb.redirectErrorStream(true); // 合并 stdout/stderr

        Process p = pb.start();

        StringBuilder sb = new StringBuilder();
        try (BufferedReader br = new BufferedReader(
                new InputStreamReader(p.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            while ((line = br.readLine()) != null) {
                sb.append(line).append('\n');
            }
        }

        boolean ok = p.waitFor(timeoutMs, TimeUnit.MILLISECONDS);
        if (!ok) {
            p.destroyForcibly();
            sb.append("\n[Runner] Timeout after ").append(timeoutMs).append(" ms");
            return new Result(124, sb.toString()); // 124: 超时常用码
        }
        return new Result(p.exitValue(), sb.toString());
    }
}