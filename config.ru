require 'rubygems'

gem 'rack', '>= 1.1.0'
require 'rack'

require File.expand_path('../rack/jnlp',  __FILE__)

SERVER_ROOT = File.expand_path('..',  __FILE__)
config = YAML.load_file(File.join(SERVER_ROOT, 'config', 'config.yml'))

PUBLIC_DIR = config[:root]

use Rack::CommonLogger
use Rack::Jnlp
use Rack::ConditionalGet
run Rack::Directory.new(PUBLIC_DIR)
