#!/usr/bin/env ruby
require 'rubygems'
require 'yaml'

require 'net/ssh'

APP_ROOT = File.expand_path('../..',  __FILE__)
CONFIG_PATH = File.join(APP_ROOT, 'config')

begin
  CONFIG = YAML.load_file(File.join(CONFIG_PATH, 'deploy.yml'))
  Net::SSH.start(CONFIG[:host], CONFIG[:username]) do |ssh|
    cmd = "pwd; cd #{CONFIG[:dir]}; git pull; git submodule update && touch tmp/restart.txt"
    puts ssh.exec!(cmd)
  end
rescue Errno::ENOENT
  msg = <<-HEREDOC


*** missing config/deploy.yml

  cp config/deploy_sample.yml config/deploy.yml

  and edit ...
  
  HEREDOC
  raise msg
rescue Net::SSH::AuthenticationFailed
  msg = <<-HEREDOC


*** SSH authentication failed connecting to: #{CONFIG[:host]}"

  check the configuration: config/deploy.yml

  HEREDOC
  raise msg
rescue SocketError
  msg = <<-HEREDOC


*** unable to connect to: #{CONFIG[:host]}"

  Are you connected to the network?

  HEREDOC
  raise msg
end

