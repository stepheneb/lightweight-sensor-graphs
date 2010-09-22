require 'rubygems'

gem 'rack', '>= 1.1.0'
require 'rack'

gem 'jnlp', '>= 0.6.2'
require 'jnlp'

require File.expand_path('../rack/jnlp',  __FILE__)

PUBLIC_DIR = 'public'

use Rack::CommonLogger
use Rack::Jnlp
use Rack::ConditionalGet
run Rack::Directory.new(PUBLIC_DIR)
