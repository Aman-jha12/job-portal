import express ,{Request,Response} from 'express';
import jsonwebtoken from 'jsonwebtoken';
import { PrismaClient } from '@Prisma/client';
import { JobType } from '@Prisma/client';
const app=express();
const prisma=new PrismaClient();
const port =process.env.PORT || 3000;



app.use(express.json());
app.use(express.urlencoded({extended:true}));


app.get("/",(req:Request,res:Response)=>{
    res.send("Welcome to Job Portal API");
   } )

app.post("/auth/register",async (req:Request,res:Response)=>{
    const {username,email,password}=req.body;
    if(!username || !email || !password){
        return res.status(400).json({message:"All fields are required"});
    }
    try{
        const existingUser=await prisma.user.findUnique({
            where:{email}
        });
        if(existingUser){
            return res.status(409).json({message:"User already exists"});
        }
        const user=await prisma.user.create({
            data:{name:username,email,password}
        });
        const token=jsonwebtoken.sign({id:user.id},process.env.JWT_SECRET as string);
        res.status(201).json({"message":"Successfully created a new userq",user,token});
        }catch(error){res.status(500).json({"message":"Error while registering a new user",error});
    }})


//company routes
app.get("/companies",async(req:Request,res:Response)=>{
    try{
        const companies=await prisma.company.findMany();
        res.status(200).json(companies);
    }catch(error){
        res.status(500).json({"message":"Error while fetching companies",error});
    }
});


app.post("/companies", async (req: Request, res: Response) => {
  const { name, description, location,ownerId} = req.body;

  if (!name || !description || !location ||!ownerId) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const existingCompany = await prisma.company.findUnique({
      where: { name }
    });

    if (existingCompany) {
      return res.status(409).json({ message: "Company already exists" });
    }

    const newCompany = await prisma.company.create({
      data: {
        name,
        description,
        location,
        owner: { connect: { id: ownerId } }
      }
    });

    res.status(201).json({
      message: "Successfully created a new company",
      newCompany
    });
  } catch (error) {
    console.error("Error while creating a new company:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});


app.get("/comanies/:id",async(req:Request,res:Response)=>{
    const {id}=req.params;
    if(!id){
      return res.status(400).json({message:"Company id is required"});
    }
    try{
      const company=await prisma.company.findUnique({
        where:{id}
      })

      if(!company){
        return res.status(404).json({message:"Company not found"});
      }
      res.status(200).json(company);
    }catch(error){
      res.status(500).json({"message":"Error while fetching company",error});
    }
})


app.put("/companies/:id",async(req:Request,res:Response)=>{
    const {id}=req.params;
    const {name,description,location}=req.body;
    if(!id){
      return res.status(400).json({message:"Company id is required"});
    }
    try{
      const company=await prisma.company.findUnique({
        where:{id}
      })

      if(!company){
        return res.status(404).json({message:"Company not found"});
      }
      const updatedCompany=await prisma.company.update({
        where:{id},
        data:{name,description,location}
      })
      res.status(200).json(updatedCompany);
    }catch(error){
      res.status(500).json({"message":"Error while updating company",error});
    }
  })
      
 app.delete("/companies/:id",async(req:Request,res:Response)=>{   
    const {id}=req.params;   
    if(!id){
      return res.status(400).json({message:"Company id is required"});
    }
    try{
      const company=await prisma.company.findUnique({
        where:{id}
      })

      if(!company){
        return res.status(404).json({message:"Company not found"});
      }
      const deletedCompany=await prisma.company.delete({
        where:{id}
      })
      res.status(200).json(deletedCompany);
    }catch(error){
      res.status(500).json({"message":"Error while deleting company",error});
    }})


// job routes would go here

app.post("/jobs", async (req: Request, res: Response) => {
  // We assume an auth middleware has run and added 'req.user'
  const { id: postedById } = req.user; 
  // <--- FIX 1: Get user ID from auth
  const { title, description, location, companyId, jobType } = req.body;

  if (!title || !description || !location || !companyId || !jobType) {
    return res.status(400).json({ message: "All fields are required" });
  }

  if (!postedById) {
    return res.status(401).json({ message: "User not authenticated" });
  }

  try {
    const newJob = await prisma.job.create({
      data: {
        title,
        description,
        location,
        type: jobType as JobType, // <--- FIX 2: Map 'jobType' variable to 'type' field
        company: { connect: { id: companyId } },
        postedBy: { connect: { id: postedById } } // <--- FIX 3: Connect the user
      }
    });
    res.status(201).json(newJob);
  } catch (error) {
    console.error("Error creating job:", error);
    res.status(500).json({ "message": "Error while creating a new job", error });
  }
});



app.get("/jobs", async (req: Request, res: Response) => {
  // Filters come from query parameters: /jobs?location=New+York&type=FULL_TIME
  const { location, type, skills } = req.query;

  try {
    // Dynamically build the 'where' filter object
    const where: prisma.JobWhereInput = {};

    if (location) {
      where.location = { equals: location as string, mode: 'insensitive' };
    }

    if (type) {
      where.type = { equals: type as JobType }; // Assumes 'type' is a valid enum value
    }

    if (skills) {
      const skillsArray = Array.isArray(skills)
        ? (skills as string[])
        : [skills as string];
        
      // Use 'hasSome' to find jobs that have at least one of the skills
      where.skillsRequired = { hasSome: skillsArray };
    }

    const jobs = await prisma.job.findMany({
      where: where,
      include: {
        // Include the company's info in the response
        company: {
          select: {
            id: true,
            name: true,
            location: true,
            website: true
          }
        },
        // Include the poster's info (but not sensitive data like password)
        postedBy: {
          select: {
            id: true,
            name: true //   User model has 'name'
          }
        }
      },
      orderBy: {
        createdAt: 'desc' // Show newest jobs first
      }
    });

    res.status(200).json(jobs);

  } catch (error) {
    console.error("Error fetching jobs:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});


app.get("/jobs/:id", async (req: Request, res: Response) => {
  const { id } = req.params; // Get ID from URL parameter

  try {
    const job = await prisma.job.findUnique({
      where: { id: id },
      include: {
        // Include all company details
        company: true, 
        // Include poster details
        postedBy: {
          select: {
            id: true,
            name: true,
            email: true // Or whatever fields you want to show
          }
        },
      }
    });

    // Handle case where job is not found
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    res.status(200).json(job);

  } catch (error) {
    console.error("Error fetching job:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});




//admin routes

app.get("/users",async(req:Request,res:Response)=>{
    try{
        const users=await prisma.user.findMany();
        res.status(200).json(users);
    }
    catch(error){
        res.status(500).json({message:"Error while fetching users",error});
    }
}); 


app.get("/companies",async(req:Request,res:Response)=>{
    try{
        const companies=await prisma.company.findMany();
        res.status(200).json(companies);
    }
    catch(error){
        res.status(500).json({message:"Error while fetching companies",error});
    }
});


app.get("/users/:id",async(req:Request,res:Response)=>{
  const {id}=req.params;
  if(!id){
    return res.status(400).json({message:"User id is required"});
  }try{
    const user=await prisma.user.findUnique({
      where:{id}
    });
  if(!user){
    return res.status(404).json({message:"User not found"});
  }
  res.status(200).json(user);
  }catch(error){
    res.status(500).json({"message":"Error while fetching user",error});
  }
})

app.get("/companies/:id",async(req:Request,res:Response)=>{
    const {id}=req.params;
    if(!id){
      return res.status(400).json({message:"Company id is required"});
    }
    try{
      const company=await prisma.company.findUnique({
        where:{id}
      })
  
      if(!company){
        return res.status(404).json({message:"Company not found"});
      }
      res.status(200).json(company);
    }catch(error){
      res.status(500).json({"message":"Error while fetching company",error});
    }
  })

  app.delete("/users/:id",async(req:Request,res:Response)=>{   
    const {id}=req.params;
    if(!id){
      return res.status(400).json({message:"User id is required"});
    }
    try{
      const user=await prisma.user.delete({
        where:{id}
      })
  
      if(!user){
        return res.status(404).json({message:"User not found"});
      }
      res.status(200).json(user);
    }catch(error){
      res.status(500).json({"message":"Error while deleting user",error});
    }
  })


  app.delete("/companies/:id",async(req:Request,res:Response)=>{   
    const {id}=req.params;   
    if(!id){
      return res.status(400).json({message:"Company id is required"});
    }
    try{
      const company=await prisma.company.delete({
        where:{id}
      })
  
      if(!company){
        return res.status(404).json({message:"Company not found"});
      }
      res.status(200).json(company);
    }catch(error){
      res.status(500).json({"message":"Error while deleting company",error}); 
    }})


    app.get("/jobs",async(req:Request,res:Response)=>{
      try{
          const jobs=await prisma.job.findMany();
          res.status(200).json(jobs);
      }catch(error){
          res.status(500).json({"message":"Error while fetching jobs",error});
      }
  })


  //notifications route would go here

  app.get("/notifications",async(req:Request,res:Response)=>{
    try{
        const notifications=await prisma.notification.findMany();
        res.status(200).json(notifications);
    }catch(error){
        res.status(500).json({"message":"Error while fetching notifications",error});
    }
  })


  app.get("/notifications/:id",async(req:Request,res:Response)=>{
    const {id}=req.params;
    if(!id){
      return res.status(400).json({message:"Notification id is required"});
    }
    try{
      const notification=await prisma.notification.findUnique({
        where:{id}
      })
  
      if(!notification){
        return res.status(404).json({message:"Notification not found"});
      }
      res.status(200).json(notification);
    }catch(error){
      res.status(500).json({"message":"Error while fetching notification",error});
    }
  })

  app.patch("/notifications/:id/read",async(req:Request,res:Response)=>{
    const {id}=req.params;
    if(!id){
      return res.status(400).json({message:"Notification id is required"});
    }
    try{
      const notification=await prisma.notification.update({
        where:{id},
        data:{isRead:true}
      })
  
      if(!notification){
        return res.status(404).json({message:"Notification not found"});
      }
      res.status(200).json(notification);
    }catch(error){
      res.status(500).json({"message":"Error while updating notification",error});
    }
  })


  app.delete("/notifications/:id",async(req:Request,res:Response)=>{   
    const {id}=req.params;   
    if(!id){
      return res.status(400).json({message:"Notification id is required"});
    }
    try{
      const notification=await prisma.notification.delete({
        where:{id}
      })
  
      if(!notification){
        return res.status(404).json({message:"Notification not found"});
      }
      res.status(200).json(notification);
    }catch(error){
      res.status(500).json({"message":"Error while deleting notification",error}); 
    }})




    //applications routes would go here

app.post("/applications/jobId",async(req:Request,res:Response)=>{  
      const {applicantId,jobId,resume,coverLetter}=req.body;
      try{
        const application=await prisma.application.create({
          data:{applicantId,jobId,resume,coverLetter}
        })
      }catch(error){
        res.status(500).json({"message":"Error while creating application",error});
      }
    })



    app.get("/applications/job/:jobId",async(req:Request,res:Response)=>{  
      const {jobId}=req.params;
      if(!jobId){
        return res.status(400).json({message:"Job id is required"});
      }
      try{
        const applications=await prisma.application.findMany({
          where:{jobId}
        })
      }catch(error){
        res.status(500).json({"message":"Error while fetching applications",error});
      }
      })


      app.patch("/applications/:id/status",async(req:Request,res:Response)=>{  
      const {id}=req.params;
      const {status}=req.body;
      if(!id){
        return res.status(400).json({message:"Application id is required"});
      }
      try{
        const application=await prisma.application.update({
          where:{id},
          data:{status}
        })
      }catch(error){
        res.status(500).json({"message":"Error while updating application",error});
      }
    })

    app.delete("/applications/:id",async(req:Request,res:Response)=>{  
      const {id}=req.params;
      if(!id){
        return res.status(400).json({message:"Application id is required"});
      }
      try{
        const application=await prisma.application.delete({
          where:{id}
        })
      }catch(error){
        res.status(500).json({"message":"Error while deleting application",error});
      }
    })

  app.get("/applications",async(req:Request,res:Response)=>{  
      const {id}=req.params;
      try{
        const applications=await prisma.application.findMany({
          where:{applicantId:id}
        })
      }catch(error){
        res.status(500).json({"message":"Error while fetching applications",error});
      }
    })


    //bookmarks routes would go here
    app.post("/bookmarks/:jobId",async(req:Request,res:Response)=>{  
      const {jobId}=req.params;
      const {userId}=req.body;
      try{
        const bookmark=await prisma.bookmark.create({
          data:{jobId,userId}
        })
      }catch(error){
        res.status(500).json({"message":"Error while creating bookmark",error});
      }
    })


    app.get("/bookmarks",async(req:Request,res:Response)=>{  
      const {userId}=req.body;
      try{
        const bookmarks=await prisma.bookmark.findMany({
          where:{userId}
        })
      }catch(error){
        res.status(500).json({"message":"Error while fetching bookmarks",error});
      }
    })



    app.delete("/bookmarks/:jobId",async(req:Request,res:Response)=>{  
    const {id}=req.params;
      try{
        const bookmark=await prisma.bookmark.delete({
          where:{id:id}
        })
      }catch(error){
        res.status(500).json({"message":"Error while deleting bookmark",error});
      }
    })


   


   app.listen(port,()=>{
    console.log(`Server is running at http://localhost:${port}`);
   });