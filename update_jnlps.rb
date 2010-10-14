#!/usr/bin/env ruby
require 'rubygems'

gem 'jnlp', '>= 0.6.2'
require 'jnlp'

require 'fileutils'
require 'open-uri'

require 'yaml'
config = YAML.load_file(File.expand_path('../config.yml',  __FILE__))
SERVER = "#{config[:host]}:#{config[:port]}"

PUBLIC_DIR = 'public'
JNLP_PATH = '/jnlp'
JNLP_DIR = PUBLIC_DIR + JNLP_PATH
JNLP_CODEBASE = SERVER + JNLP_PATH

maven_jnlps_url = "http://jnlp.concord.org/dev/org/concord/maven-jnlp"
families = %w{sensor-applets}

jnlps = []
new_hrefs = []

puts "\nLoading most recent versioned jnlps from:\n"

families.each do |family|
  snapshot_version_path = "#{family}-CURRENT_VERSION.txt"
  snapshot_version = open("#{maven_jnlps_url}/#{family}/#{snapshot_version_path}").read
  versioned_jnlp_url = "#{maven_jnlps_url}/#{family}/#{family}-#{snapshot_version}.jnlp"
  puts "  #{versioned_jnlp_url} ..."
  jnlp = Jnlp::Jnlp.new(versioned_jnlp_url, JNLP_DIR, {:include_pack_gz => true, :verbose => true})
  jnlp.write_jnlp( { :dir => JNLP_DIR, :jnlp => { :codebase => JNLP_CODEBASE, :href => "#{JNLP_CODEBASE}#{jnlp.path}" }, :snapshot => true } )
end
