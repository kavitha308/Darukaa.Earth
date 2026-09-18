"""Initial PostGIS schema for Darukaa.Earth

Revision ID: 0001
Revises: 
Create Date: 2026-09-18 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from geoalchemy2 import Geometry

revision = '0001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Ensure postgis extension exists
    op.execute('CREATE EXTENSION IF NOT EXISTS postgis;')
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')

    op.create_table(
        'users',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('full_name', sa.String(length=255), nullable=False),
        sa.Column('role', sa.String(length=50), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)

    op.create_table(
        'projects',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('project_type', sa.String(length=100), nullable=False),
        sa.Column('country', sa.String(length=100), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('owner_id', sa.String(length=36), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['owner_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_projects_name'), 'projects', ['name'], unique=False)

    op.create_table(
        'sites',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('project_id', sa.String(length=36), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('geometry', Geometry(geometry_type='POLYGON', srid=4326, spatial_index=True), nullable=False),
        sa.Column('area_hectares', sa.Float(), nullable=False),
        sa.Column('centroid_lat', sa.Float(), nullable=False),
        sa.Column('centroid_lng', sa.Float(), nullable=False),
        sa.Column('bbox', sa.JSON(), nullable=True),
        sa.Column('biome', sa.String(length=100), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_sites_project_id'), 'sites', ['project_id'], unique=False)

    op.create_table(
        'site_metrics',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('site_id', sa.String(length=36), nullable=False),
        sa.Column('recorded_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('carbon_sequestration_rate_tco2e_per_ha', sa.Float(), nullable=False),
        sa.Column('cumulative_carbon_tco2e', sa.Float(), nullable=False),
        sa.Column('biodiversity_index', sa.Float(), nullable=False),
        sa.Column('species_richness_count', sa.Integer(), nullable=False),
        sa.Column('ndvi', sa.Float(), nullable=False),
        sa.Column('canopy_cover_percentage', sa.Float(), nullable=False),
        sa.Column('soil_organic_carbon_pct', sa.Float(), nullable=False),
        sa.Column('sensor_source', sa.String(length=100), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['site_id'], ['sites.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_site_metrics_site_id'), 'site_metrics', ['site_id'], unique=False)
    op.create_index(op.f('ix_site_metrics_recorded_at'), 'site_metrics', ['recorded_at'], unique=False)


def downgrade() -> None:
    op.drop_table('site_metrics')
    op.drop_table('sites')
    op.drop_table('projects')
    op.drop_table('users')
