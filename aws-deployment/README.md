# AWS Deployment Guide for E-commerce Analytics Platform

This guide explains how to deploy the E-commerce Analytics Platform on AWS.

## Architecture Overview

We'll use the following AWS services:

- **EC2 instances** for the Node.js services
- **MongoDB Atlas** for the database
- **Amazon MSK (Managed Streaming for Kafka)** for Kafka
- **Elastic Load Balancer** for distributing traffic
- **S3 + CloudFront** for hosting the React frontend
- **Route 53** for DNS management

## Deployment Steps

### 1. Set Up MongoDB Atlas

1. Create a MongoDB Atlas account if you don't have one
2. Create a new cluster (M0 free tier is sufficient for testing)
3. Configure network access to allow connections from your AWS VPC
4. Create a database user with appropriate permissions
5. Note your connection string

### 2. Set Up Amazon MSK

1. Create a VPC for your Kafka cluster
2. Create an MSK cluster:
   \`\`\`
   aws kafka create-cluster \\
     --cluster-name ecommerce-analytics-kafka \\
     --broker-node-group-info file://broker-nodes.json \\
     --kafka-version "2.8.1" \\
     --number-of-broker-nodes 3 \\
     --encryption-info file://encryption-info.json
   \`\`\`
3. Configure security groups to allow traffic between your services and MSK

### 3. Deploy Node.js Services on EC2

#### For each service (event-collector, data-processor, api-server):

1. Launch an EC2 instance (t2.micro for testing, t2.small or larger for production)
2. Install Node.js and Docker:
   \`\`\`
   sudo apt update
   sudo apt install -y nodejs npm docker.io
   sudo systemctl start docker
   sudo systemctl enable docker
   \`\`\`
3. Clone your repository:
   \`\`\`
   git clone https://github.com/yourusername/ecommerce-analytics.git
   cd ecommerce-analytics
   \`\`\`
4. Set up environment variables:
   \`\`\`
   export PORT=3001  # or 3002 for api-server
   export KAFKA_BROKER=<your-msk-bootstrap-servers>
   export MONGODB_URI=<your-mongodb-atlas-connection-string>
   \`\`\`
5. Build and run the service:
   \`\`\`
   cd <service-directory>
   npm install
   npm start
   \`\`\`
6. Set up PM2 for process management:
   \`\`\`
   npm install -g pm2
   pm2 start server.js  # or processor.js for data-processor
   pm2 startup
   pm2 save
   \`\`\`

### 4. Set Up Load Balancer for API Server

1. Create an Application Load Balancer
2. Configure listeners for HTTP (port 80) and HTTPS (port 443)
3. Create a target group with your API server EC2 instance
4. Configure health checks to /health endpoint
5. Set up SSL certificate using AWS Certificate Manager

### 5. Deploy React Frontend to S3 and CloudFront

1. Build the React app:
   \`\`\`
   cd frontend
   npm install
   REACT_APP_API_URL=https://api.yourdomain.com npm run build
   \`\`\`
2. Create an S3 bucket:
   \`\`\`
   aws s3 mb s3://ecommerce-analytics-frontend
   \`\`\`
3. Configure the bucket for static website hosting:
   \`\`\`
   aws s3 website s3://ecommerce-analytics-frontend --index-document index.html --error-document index.html
   \`\`\`
4. Upload the build files:
   \`\`\`
   aws s3 sync build/ s3://ecommerce-analytics-frontend
   \`\`\`
5. Create a CloudFront distribution:
   - Origin: Your S3 bucket
   - Behaviors: Redirect HTTP to HTTPS
   - Cache policy: CachingOptimized
   - Price class: Use only North America and Europe
   - Alternate domain names: dashboard.yourdomain.com
   - SSL certificate: Custom SSL certificate (ACM)

### 6. Set Up Route 53

1. Create a hosted zone for your domain
2. Create A records for:
   - api.yourdomain.com -> ALB DNS name
   - dashboard.yourdomain.com -> CloudFront distribution domain name

## Automation with CloudFormation

For a more automated approach, you can use the included CloudFormation template:

\`\`\`
aws cloudformation create-stack \\
  --stack-name ecommerce-analytics \\
  --template-body file://cloudformation-template.yaml \\
  --parameters ParameterKey=KeyName,ParameterValue=your-key-pair
\`\`\`

## Monitoring and Scaling

1. Set up CloudWatch alarms for:
   - EC2 CPU utilization
   - MSK broker CPU utilization
   - Application metrics

2. Configure Auto Scaling groups for EC2 instances:
   \`\`\`
   aws autoscaling create-auto-scaling-group \\
     --auto-scaling-group-name api-server-asg \\
     --launch-configuration-name api-server-lc \\
     --min-size 2 \\
     --max-size 5 \\
     --desired-capacity 2 \\
     --vpc-zone-identifier "subnet-xxxx,subnet-yyyy"
   \`\`\`

## Security Considerations

1. Use IAM roles for EC2 instances instead of access keys
2. Configure security groups to allow only necessary traffic
3. Enable encryption at rest for MongoDB Atlas and MSK
4. Use AWS Secrets Manager for storing sensitive credentials
5. Enable CloudTrail for auditing API calls`;

fs.mkdirSync('aws-deployment', { recursive: true });
fs.writeFileSync('aws-deployment/README.md', awsReadme);
console.log('Created AWS deployment guide');
\`\`\`

Let's create a CloudFormation template for AWS deployment:

```js project="CloudFormation" file="aws-deployment/cloudformation-template.yaml" type="nodejs"
import fs from 'fs';

const cloudFormationTemplate = `AWSTemplateFormatVersion: '2010-09-09'
Description: 'E-commerce Analytics Platform Infrastructure'

Parameters:
  KeyName:
    Description: Name of an existing EC2 KeyPair to enable SSH access
    Type: AWS::EC2::KeyPair::KeyName
    ConstraintDescription: Must be the name of an existing EC2 KeyPair

  InstanceType:
    Description: EC2 instance type
    Type: String
    Default: t2.small
    AllowedValues:
      - t2.micro
      - t2.small
      - t2.medium
    ConstraintDescription: Must be a valid EC2 instance type

  SSHLocation:
    Description: The IP address range that can SSH to the EC2 instances
    Type: String
    Default: 0.0.0.0/0
    AllowedPattern: (\\d{1,3})\\.(\\d{1,3})\\.(\\d{1,3})\\.(\\d{1,3})/(\\d{1,2})
    ConstraintDescription: Must be a valid IP CIDR range of the form x.x.x.x/x

Resources:
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsSupport: true
      EnableDnsHostnames: true
      Tags:
        - Key: Name
          Value: EcommerceAnalyticsVPC

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: EcommerceAnalyticsIG

  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      InternetGatewayId: !Ref InternetGateway
      VpcId: !Ref VPC

  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [ 0, !GetAZs '' ]
      CidrBlock: 10.0.1.0/24
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: EcommerceAnalyticsPublicSubnet1

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [ 1, !GetAZs '' ]
      CidrBlock: 10.0.2.0/24
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: EcommerceAnalyticsPublicSubnet2

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: EcommerceAnalyticsPublicRouteTable

  DefaultPublicRoute:
    Type: AWS::EC2::Route
    DependsOn: InternetGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  PublicSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PublicRouteTable
      SubnetId: !Ref PublicSubnet1

  PublicSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PublicRouteTable
      SubnetId: !Ref PublicSubnet2

  EventCollectorSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for Event Collector service
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref SSHLocation
        - IpProtocol: tcp
          FromPort: 3001
          ToPort: 3001
          CidrIp: 0.0.0.0/0

  DataProcessorSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for Data Processor service
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref SSHLocation

  ApiServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for API Server
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref SSHLocation
        - IpProtocol: tcp
          FromPort: 3002
          ToPort: 3002
          CidrIp: 0.0.0.0/0

  KafkaSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for MSK
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 9092
          ToPort: 9092
          SourceSecurityGroupId: !Ref EventCollectorSecurityGroup
        - IpProtocol: tcp
          FromPort: 9092
          ToPort: 9092
          SourceSecurityGroupId: !Ref DataProcessorSecurityGroup
        - IpProtocol: tcp
          FromPort: 9092
          ToPort: 9092
          SourceSecurityGroupId: !Ref ApiServerSecurityGroup

  EventCollectorInstance:
    Type: AWS::EC2::Instance
    Properties:
      InstanceType: !Ref InstanceType
      SecurityGroupIds:
        - !Ref EventCollectorSecurityGroup
      KeyName: !Ref KeyName
      ImageId: ami-0c55b159cbfafe1f0  # Amazon Linux 2 AMI (adjust for your region)
      SubnetId: !Ref PublicSubnet1
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash -xe
          yum update -y
          yum install -y git nodejs npm
          curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
          export NVM_DIR="$HOME/.nvm"
          [ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh"
          nvm install 16
          nvm use 16
          npm install -g pm2
          
          # Clone repository and set up service
          git clone https://github.com/yourusername/ecommerce-analytics.git /home/ec2-user/ecommerce-analytics
          cd /home/ec2-user/ecommerce-analytics/event-collector
          npm install
          
          # Create environment file
          cat > /home/ec2-user/ecommerce-analytics/event-collector/.env << 'EOL'
          PORT=3001
          KAFKA_BROKER=${KafkaCluster.BootstrapBrokerString}
          EOL
          
          # Start service with PM2
          pm2 start server.js
          pm2 startup
          pm2 save
          
          # Set correct permissions
          chown -R ec2-user:ec2-user /home/ec2-user/ecommerce-analytics
      Tags:
        - Key: Name
          Value: EventCollector

  DataProcessorInstance:
    Type: AWS::EC2::Instance
    Properties:
      InstanceType: !Ref InstanceType
      SecurityGroupIds:
        - !Ref DataProcessorSecurityGroup
      KeyName: !Ref KeyName
      ImageId: ami-0c55b159cbfafe1f0  # Amazon Linux 2 AMI (adjust for your region)
      SubnetId: !Ref PublicSubnet1
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash -xe
          yum update -y
          yum install -y git nodejs npm
          curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
          export NVM_DIR="$HOME/.nvm"
          [ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh"
          nvm install 16
          nvm use 16
          npm install -g pm2
          
          # Clone repository and set up service
          git clone https://github.com/yourusername/ecommerce-analytics.git /home/ec2-user/ecommerce-analytics
          cd /home/ec2-user/ecommerce-analytics/data-processor
          npm install
          
          # Create environment file
          cat > /home/ec2-user/ecommerce-analytics/data-processor/.env << 'EOL'
          KAFKA_BROKER=${KafkaCluster.BootstrapBrokerString}
          MONGODB_URI=mongodb+srv://username:password@your-mongodb-atlas-cluster.mongodb.net/ecommerce-analytics
          EOL
          
          # Start service with PM2
          pm2 start processor.js
          pm2 startup
          pm2 save
          
          # Set correct permissions
          chown -R ec2-user:ec2-user /home/ec2-user/ecommerce-analytics
      Tags:
        - Key: Name
          Value: DataProcessor

  ApiServerInstance:
    Type: AWS::EC2::Instance
    Properties:
      InstanceType: !Ref InstanceType
      SecurityGroupIds:
        - !Ref ApiServerSecurityGroup
      KeyName: !Ref KeyName
      ImageId: ami-0c55b159cbfafe1f0  # Amazon Linux 2 AMI (adjust for your region)
      SubnetId: !Ref PublicSubnet1
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash -xe
          yum update -y
          yum install -y git nodejs npm
          curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
          export NVM_DIR="$HOME/.nvm"
          [ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh"
          nvm install 16
          nvm use 16
          npm install -g pm2
          
          # Clone repository and set up service
          git clone https://github.com/yourusername/ecommerce-analytics.git /home/ec2-user/ecommerce-analytics
          cd /home/ec2-user/ecommerce-analytics/api-server
          npm install
          
          # Create environment file
          cat > /home/ec2-user/ecommerce-analytics/api-server/.env << 'EOL'
          PORT=3002
          KAFKA_BROKER=${KafkaCluster.BootstrapBrokerString}
          MONGODB_URI=mongodb+srv://username:password@your-mongodb-atlas-cluster.mongodb.net/ecommerce-analytics
          EOL
          
          # Start service with PM2
          pm2 start server.js
          pm2 startup
          pm2 save
          
          # Set correct permissions
          chown -R ec2-user:ec2-user /home/ec2-user/ecommerce-analytics
      Tags:
        - Key: Name
          Value: ApiServer

  KafkaCluster:
    Type: AWS::MSK::Cluster
    Properties:
      ClusterName: EcommerceAnalyticsKafka
      KafkaVersion: 2.8.1
      NumberOfBrokerNodes: 3
      BrokerNodeGroupInfo:
        InstanceType: kafka.t3.small
        ClientSubnets:
          - !Ref PublicSubnet1
          - !Ref PublicSubnet2
        SecurityGroups:
          - !Ref KafkaSecurityGroup
        StorageInfo:
          EBSStorageInfo:
            VolumeSize: 100
      EncryptionInfo:
        EncryptionInTransit:
          ClientBroker: TLS_PLAINTEXT
          InCluster: true

  ApiLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: ApiServerLB
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      SecurityGroups:
        - !Ref ApiServerSecurityGroup
      Type: application

  ApiTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: ApiServerTargets
      Port: 3002
      Protocol: HTTP
      VpcId: !Ref VPC
      HealthCheckPath: /health
      HealthCheckIntervalSeconds: 30
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 5
      Targets:
        - Id: !Ref ApiServerInstance
          Port: 3002

  ApiListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref ApiTargetGroup
      LoadBalancerArn: !Ref ApiLoadBalancer
      Port: 80
      Protocol: HTTP

  S3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub ecommerce-analytics-frontend-${AWS::AccountId}
      AccessControl: PublicRead
      WebsiteConfiguration:
        IndexDocument: index.html
        ErrorDocument: index.html

  BucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref S3Bucket
      PolicyDocument:
        Statement:
          - Action:
              - s3:GetObject
            Effect: Allow
            Resource: !Sub arn:aws:s3:::${S3Bucket}/*
            Principal: '*'

  CloudFrontDistribution:
    Type: AWS::CloudFront::Distribution
    Properties:
      DistributionConfig:
        Origins:
          - DomainName: !GetAtt S3Bucket.DomainName
            Id: S3Origin
            S3OriginConfig:
              OriginAccessIdentity: ''
        Enabled: true
        DefaultRootObject: index.html
        DefaultCacheBehavior:
          TargetOriginId: S3Origin
          ForwardedValues:
            QueryString: false
            Cookies:
              Forward: none
          ViewerProtocolPolicy: redirect-to-https
        PriceClass: PriceClass_100
        ViewerCertificate:
          CloudFrontDefaultCertificate: true
        CustomErrorResponses:
          - ErrorCode: 404
            ResponseCode: 200
            ResponsePagePath: /index.html

Outputs:
  EventCollectorURL:
    Description: URL for the Event Collector
    Value: !Sub http://${EventCollectorInstance.PublicDnsName}:3001

  ApiServerURL:
    Description: URL for the API Server
    Value: !Sub http://${ApiLoadBalancer.DNSName}

  KafkaBootstrapServers:
    Description: Kafka Bootstrap Servers
    Value: !GetAtt KafkaCluster.BootstrapBrokerString

  FrontendURL:
    Description: URL for the Frontend
    Value: !Sub https://${CloudFrontDistribution.DomainName}