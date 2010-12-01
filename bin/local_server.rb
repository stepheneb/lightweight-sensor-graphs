#!/usr/bin/env ruby

require 'rubygems'
require 'yaml'
require 'logger'

APP_ROOT = File.expand_path('../..',  __FILE__)
CONFIG_PATH = File.join(APP_ROOT, 'config')

LOGGER_PATH = File.join(APP_ROOT, 'log', 'app.log')
logger = Logger.new(LOGGER_PATH)

gem 'rack', '>= 1.1.0'
require 'rack'

require File.join(APP_ROOT, 'rack', 'jnlp')

JRUBY = (defined? RUBY_ENGINE and RUBY_ENGINE[/(java|jruby)/])
unless JRUBY
  gem 'thin', '>= 1.2.7'
  require 'thin'
end

begin
  CONFIG = YAML.load_file(File.join(CONFIG_PATH, 'config.yml'))
rescue Errno::ENOENT
  msg = <<-HEREDOC


*** missing config/config.yml

    cp config/config_sample.yml config/config.yml

    and edit if you need to change the public dir or the port the local applet server runs on ...
  
  HEREDOC
  raise msg
end



SERVER_URL = "#{CONFIG[:host]}:#{CONFIG[:port]}"
PUBLIC_DIR = File.join(APP_ROOT, CONFIG[:root])

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
  Rack::Handler::WEBrick.run(jnlp_app.to_app, :Port => CONFIG[:port])
else
  puts "running in MRI, using Thin"
  Rack::Handler::Thin.run(jnlp_app.to_app, :Port => CONFIG[:port])
end

