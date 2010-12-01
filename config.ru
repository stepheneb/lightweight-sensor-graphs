require 'rubygems'
require 'yaml'
require 'logger'

gem 'rack', '>= 1.1.0'
require 'rack'

require File.expand_path('../rack/jnlp',  __FILE__)

APP_ROOT = File.expand_path('..',  __FILE__)
CONFIG = YAML.load_file(File.join(APP_ROOT, 'config', 'config.yml'))
PUBLIC_DIR = CONFIG[:root]

LOGGER_PATH = File.join(APP_ROOT, 'log', 'app.log')
logger = Logger.new(LOGGER_PATH)

use Rack::CommonLogger
use Rack::Jnlp
use Rack::ConditionalGet
run Rack::Directory.new(PUBLIC_DIR)
