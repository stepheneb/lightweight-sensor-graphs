module Rack
  class Jnlp

    PACK_GZ = '.pack.gz'

    def initialize app
      @app = app
      @jnlp_dir = PUBLIC_DIR
    end

    def jar_request(path)
      if path =~ /^(\/.*\/)(.*?).jar/
      	dir, name = $1, $2
        jars = Dir["#{@jnlp_dir}#{dir}#{name}__*.jar"]
        if jars.empty?
          nil
        else
          jars.sort.last[/#{@jnlp_dir}(.*)/, 1]
        end
      else
        nil
      end
    end

    def call env
      path = env["PATH_INFO"]
      version_id = env["QUERY_STRING"][/version-id=(.*)/, 1]
      pack200_gzip = versioned_jar_path = false
      if snapshot_path = jar_request(path)
        if env['HTTP_ACCEPT_ENCODING']
          pack200_gzip = env['HTTP_ACCEPT_ENCODING'][/pack200-gzip/]
        end
        if version_id
          versioned_jar_path = path.gsub(/(.*?)(\.jar$)/, "\\1__V#{version_id}\\2")
          versioned_jar_path << Rack::Jnlp::PACK_GZ if pack200_gzip
          env["PATH_INFO"] = versioned_jar_path
        else
          snapshot_path << Rack::Jnlp::PACK_GZ if pack200_gzip
          env["PATH_INFO"] = snapshot_path
        end
      end
      status, headers, body = @app.call env
      headers['Content-Type'] = 'application/java-archive' if snapshot_path
      headers['x-java-jnlp-version-id'] = version_id       if versioned_jar_path
      headers['content-encoding'] = 'pack200-gzip'         if pack200_gzip
      [status, headers, body]
    end

  end
end
