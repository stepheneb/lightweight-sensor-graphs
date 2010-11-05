#!/usr/bin/env ruby

require 'rubygems'
require 'yaml'

gem 'rack', '>= 1.1.0'
require 'rack'

require File.expand_path('../rack/jnlp',  __FILE__)

JRUBY = (defined? RUBY_ENGINE and RUBY_ENGINE[/(java|jruby)/])
unless JRUBY
  gem 'thin', '>= 1.2.7'
  require 'thin'
end

SERVER_ROOT = File.expand_path('..',  __FILE__)
config = YAML.load_file(File.join(SERVER_ROOT, '/config/config.yml'))
SERVER_URL = "#{config[:host]}:#{config[:port]}"

PUBLIC_DIR = File.join(SERVER_ROOT, config[:root])

jnlps = Dir["#{PUBLIC_DIR}/**/*.jnlp"].collect { |p| p.gsub(/^#{PUBLIC_DIR}/, SERVER_URL)}
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