class User < ActiveRecord::Base

  # Include default devise modules. Others available are:
  # :token_authenticatable, :confirmable, :lockable and :timeoutable
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :trackable, :validatable,
         :authentication_keys => [ :login ]

  validates :login, :presence => true, :uniqueness => true
  validates_format_of :login, :with => /\A[A-Za-z][\w-]*\Z/

  attr_accessor :requested_group

  has_and_belongs_to_many :roles

  has_many :groups_users, :dependent => :destroy
  has_many :groups, :through => :groups_users, :conditions => {'groups_users.granted' => true}

  accepts_nested_attributes_for :groups_users

  serialize :app_infos, JSON

  attr_accessible :login, :name, :email, :password, :password_confirmation, :remember_me, :requested_group, :groups_users_attributes, :app_infos

  before_create :add_requested_group

  def has_role?(rolename)
    roles.any? { |role| role.name == rolename.to_s }
  end

  def add_requested_group
    groups << Group.find(requested_group) if requested_group #with granted => false
  end

end
