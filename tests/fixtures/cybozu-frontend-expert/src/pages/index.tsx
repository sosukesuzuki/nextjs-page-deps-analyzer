import { Layout } from "../components/Layout";
import { PageLayout } from "../components/PageLayout";
import { SpeakerDeck } from "../components/SpeakerDeck";

const IndexPage = () => (
  <Layout>
    <PageLayout>
      <h2>Hello Cybozu Frontend Expert Team π</h2>
      <SpeakerDeck
        embedId="0efec8a9dd224baebfb2aaf30fbe9a28"
        width="100%"
        title="γγ­γ³γγ¨γ³γγ¨γ­γΉγγΌγγγΌγ γ«γ€γγ¦"
      />
    </PageLayout>
  </Layout>
);

export default IndexPage;
