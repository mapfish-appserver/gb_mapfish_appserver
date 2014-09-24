Rails.application.routes.draw do

  devise_for :users,
    :path => "session", :controllers => {:registrations => "registrations"},
    :sign_out_via => [ :get, :delete ]
  # https://github.com/plataformatec/devise/wiki/How-To:-Redirect-to-a-specific-page-on-successful-sign-in
  # redirects defined in ApplicationController
  devise_scope :user do
    match '/session/welcome' => "registrations#index", :as => :user_welcome
    match '/session/login' => "registrations#login", :as => :user_login
    match '/session/logout' => "registrations#logout", :as => :user_logout
    match '/session/confirm' => "registrations#confirm", :as => :user_confirm
  end

  mount RailsAdmin::Engine => '/gbadmin', :as => 'rails_admin'

  resources :token_authentications, :only => [:create, :destroy]

  resources :groups_users do
    get :register, :on => :collection
  end
  resources :users do
    get :find, :on => :collection
  end

  resources :topics_layers

  resources :layers

  resources :topics do
    get :query, :on => :collection
    get :legend, :on => :member
  end

  resources :maps

  match 'search/:rule' => 'search#index'
  match 'locate/:rule' => 'search#locate', :as => :locate
  match 'services/:rule.wsdl' => 'search#soap_wsdl', :as => :services_description
  match 'services/:rule' => 'search#soap', :as => :services

  match 'wms/access/:service' => 'wms#access', :as => :wms_access
  match 'wms/:service' => 'wms#show', :via => [:get, :post], :as => :wms

  match 'wfs/access/:service' => 'wfs#access', :as => :wfs_access
  match 'wfs/:service' => 'wfs#show', :as => :wfs

  match 'print/info.:format' => "print#info"
  match 'print/create' => "print#create", :via => :post
  match 'print/:id' => "print#show"

  match 'upload/gpx' => "upload#gpx", :via => :post

  match ':app' => 'apps#show'
  #root :to => "apps#show", :app => "gb41"
end
