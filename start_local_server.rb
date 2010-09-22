require 'rubygems'

gem 'rack', '>= 1.1.0'
require 'rack'

gem 'jnlp', '>= 0.6.3'
require 'jnlp'

require File.expand_path('../rack/jnlp',  __FILE__)

JRUBY = (defined? RUBY_ENGINE and RUBY_ENGINE == 'java')
require 'thin' unless JRUBY

require 'yaml'
config = YAML.load_file('config.yml')
SERVER = "#{config[:host]}:#{config[:port]}"

PUBLIC_DIR = 'public'

jnlps = Dir["#{PUBLIC_DIR}/**/*.jnlp"].collect { |p| p.gsub(/^#{PUBLIC_DIR}/, SERVER)}
puts "\nServing jnlps locally at:\n  #{jnlps.join("\n  ")}"

jnlp_app = Rack::Builder.new do
  map "/" do
    use Rack::CommonLogger
    use Rack::Jnlp
    use Rack::ConditionalGet
    run Rack::Directory.new(PUBLIC_DIR)
  end
end

puts "\nStarting server (press ctrl-C to quit)\n\n"

if JRUBY
  puts "running in JRuby, using Webrick"
  Rack::Handler::WEBrick.run(jnlp_app.to_app, :Port => 4321)
else
  puts "running in MRI, using Thin"
  # Rack::Server.new(:app => jnlp_app.to_app, :Port => 4321)
  Rack::Handler::Thin.run(jnlp_app.to_app, :Port => 4321)
end

# Rack::Server.new(:app => proc { |env| ... }, :Port => 3002, :server => 'webrick').start

# trap(:INT) { server.shutdown }