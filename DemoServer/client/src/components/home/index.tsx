import * as React from "react";
import { UserProgressDto } from "../../models/demoModels";
import { Category, categoryList } from "../demos/categories";
import { connect } from "react-redux";
import { AppState } from "../../store/state";
import { DemoThunkDispatch } from "../../store";
import { getProgress } from "../../store/actions/demoActions";
import { DemoCategory } from "./DemoCategory";

interface HomeStateProps {
    loadingProgress: boolean;
    progress: UserProgressDto;
}

interface HomeDispatchProps {
    getProgress: () => void;
}

type HomeProps = HomeStateProps & HomeDispatchProps;

class HomeDisplay extends React.Component<HomeProps, {}> {
    componentDidMount() {
        const { getProgress } = this.props;
        getProgress();
    }

    getCategoryElement(category: Category, index: number) {
        const { progress } = this.props;
        const completedForCategory = progress
            && progress.completedDemos
            && progress.completedDemos.filter(x => x.categorySlug === category.slug);

        return <DemoCategory category={category} key={`demo_category_${index}`} completedDemos={completedForCategory} />
    }

    render() {
        return <>
            <div className="header-image"><h1>Dive into RavenDB</h1></div>
            <div className="demo-list">
                {categoryList.map((x, i) => this.getCategoryElement(x, i))}
            </div>
        </>;
    }
}

export const Home = connect<HomeStateProps, HomeDispatchProps, {}>(
    ({ demos }: AppState): HomeStateProps => {
        return {
            loadingProgress: demos.loadingProgress,
            progress: demos.userProgress
        }
    },
    (dispatch: DemoThunkDispatch): HomeDispatchProps => {
        return {
            getProgress: () => dispatch(getProgress())
        }
    }
)(HomeDisplay);