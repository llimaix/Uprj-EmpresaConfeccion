provider "aws" {
  region = "us-east-1"
}

# 1. S3 bucket
resource "aws_s3_bucket" "static_site" {
  bucket = "app-db-fe"

  force_destroy = true  

  tags = {
    Name        = "static-site"
    Environment = "dev"
  }
}

# 2. Bloquear acceso público al bucket (mejor práctica)
resource "aws_s3_bucket_public_access_block" "block_public" {
  bucket = aws_s3_bucket.static_site.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# 3. Hosting estático
resource "aws_s3_bucket_website_configuration" "static_site" {
  bucket = aws_s3_bucket.static_site.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "error.html"
  }
}

# 4. Origin Access Control para CloudFront (reemplaza OAI)
resource "aws_cloudfront_origin_access_control" "oac" {
  name                              = "s3-origin-access-control"
  description                       = "OAC for static site"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# 5. CloudFront Distribution
resource "aws_cloudfront_distribution" "cdn" {
  enabled             = true
  default_root_object = "index.html"

  origin {
    domain_name = aws_s3_bucket.static_site.bucket_regional_domain_name
    origin_id   = "s3-static-site-origin"

    origin_access_control_id = aws_cloudfront_origin_access_control.oac.id
  }

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "s3-static-site-origin"

    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = false

      cookies {
        forward = "none"
      }
    }
  }

  price_class = "PriceClass_100" # usa edge locations solo en EE.UU., México, Canadá, Europa

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = {
    Environment = "dev"
    Project     = "static-site"
  }
}

# 6. Política S3 para CloudFront (OAC) - acceso restringido
data "aws_iam_policy_document" "cf_access" {
  statement {
    actions = ["s3:GetObject"]

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    resources = ["${aws_s3_bucket.static_site.arn}/*"]

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.cdn.arn]
    }
  }
}

resource "aws_s3_bucket_policy" "cf_access_policy" {
  bucket = aws_s3_bucket.static_site.id
  policy = data.aws_iam_policy_document.cf_access.json
}
