Dummy::Application.configure do
  # Settings specified here will take precedence over those in config/application.rb

  # The test environment is used exclusively to run your application's
  # test suite. You never need to work with it otherwise. Remember that
  # your test database is "scratch space" for the test suite and is wiped
  # and recreated between test runs. Don't rely on the data there!
  config.cache_classes = true

  # Configure static asset server for tests with Cache-Control for performance
  config.serve_static_assets = true
  config.static_cache_control = "public, max-age=3600"

  # Log error messages when you accidentally call methods on nil
  config.whiny_nils = true

  # Show full error reports and disable caching
  config.consider_all_requests_local       = true
  config.action_controller.perform_caching = false

  # Raise exceptions instead of rendering exception templates
  config.action_dispatch.show_exceptions = false

  # Disable request forgery protection in test environment
  config.action_controller.allow_forgery_protection    = false

  # Tell Action Mailer not to deliver emails to the real world.
  # The :test delivery method accumulates sent emails in the
  # ActionMailer::Base.deliveries array.
  config.action_mailer.delivery_method = :test

  # Raise exception on mass assignment protection for Active Record models
  config.active_record.mass_assignment_sanitizer = :strict

  # Print deprecation notices to the stderr
  config.active_support.deprecation = :stderr
end

#Parts for building a Mapserver URL
# Example: http://localhost/cgi-bin/mapserv.fcgi?map=/home/pi/code/rails/dummy/mapconfig/maps.example.com/naturalearth.map)
MAPSERV_SERVER = 'http://localhost' #nil for current application server
MAPSERV_URL = '/cgi-bin/mapserv.fcgi'
MAPSERV_CGI_URL = '/cgi-bin/mapserv'
MAPPATH = '/home/pi/code/rails/dummy/mapconfig'

#Internal URL of print servlet (nil: print-standalone)
PRINT_URL = nil #'http://localhost:8080/mapfish_print/print/myapp'
